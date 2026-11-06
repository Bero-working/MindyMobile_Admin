import * as Y from 'yjs';
import { z } from 'zod';
import { io, type Socket } from 'socket.io-client';
import { newIntentKey } from '@/modules/attendance/services/intentKey';
import { encode, decode, shapesOf } from './document';
import { syncSchema, type BoardSync, type Shape } from './schema';

export type ConnectionState = {
  status: 'connecting' | 'ready' | 'saving' | 'offline' | 'revoked';
  sync?: BoardSync | undefined;
  shapes: Shape[];
  people: { id: string; name: string }[];
  notice?: 'epoch' | 'rejected' | 'connection';
};
type Pending = { epoch: string; updateId: string; binary: string };
type Reply = {
  ok: boolean;
  data?: object;
  error?: { statusCode: number; code: string };
};
export const boardSocket = (url: string, origin: string) =>
  io(new URL(url).origin, {
    path: '/ws/whiteboards',
    addTrailingSlash: false,
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false,
    extraHeaders: { Origin: origin },
  });

/** One in-flight edit. Only a durable update ACK unlocks the next edit. */
export class BoardConnection {
  private doc = new Y.Doc();
  private pending: Pending | undefined;
  private closed = false;
  private renewing = false;
  private generation = 0;
  state: ConnectionState = { status: 'connecting', shapes: [], people: [] };
  get hasPending() {
    return !!this.pending;
  }
  constructor(
    private socket: Socket,
    private boardId: string,
    private changed: (state: ConnectionState) => void,
    private renew: () => Promise<boolean>
  ) {}
  private publish(patch: Partial<ConnectionState>) {
    if (this.closed) return;
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
  }
  start() {
    this.socket.on('connect', () => this.join());
    this.socket.on('board:state', (raw: BoardSync) => this.accept(raw));
    this.socket.on(
      'board:presence',
      (raw: { people: { id: string; name: string }[] }) => {
        const value = z
          .object({
            people: z.array(z.object({ id: z.string(), name: z.string() })),
          })
          .safeParse(raw);
        if (value.success) this.publish({ people: value.data.people });
      }
    );
    this.socket.on('board:revoked', () => this.revoke());
    this.socket.on('disconnect', (reason: string) => {
      this.generation++;
      if (this.state.status === 'revoked' || this.closed) return;
      this.publish({ status: 'offline', people: [] });
      if (reason === 'io server disconnect') this.recoverAuth();
    });
    this.socket.on('connect_error', () => {
      this.publish({ status: 'offline', notice: 'connection' });
      this.recoverAuth();
    });
    this.socket.connect();
  }
  private async recoverAuth() {
    if (this.renewing || this.closed) return;
    this.renewing = true;
    try {
      if (await this.renew()) {
        if (!this.closed) this.socket.connect();
      }
    } catch {
      /* Retry stays explicit after a failed HTTP refresh. */
    }
  }
  reconnect() {
    if (this.closed || this.state.status === 'revoked') return;
    this.renewing = false;
    if (this.socket.connected) this.join();
    else this.socket.connect();
  }
  pause() {
    this.generation++;
    this.publish({ status: 'offline', people: [] });
    this.socket.disconnect();
  }
  private join() {
    const generation = ++this.generation;
    this.publish({ status: 'connecting' });
    this.socket
      .timeout(10000)
      .emit(
        'board:join',
        { boardId: this.boardId },
        (error: Error | null, reply: Reply) => {
          if (this.closed || generation !== this.generation) return;
          if (error || !reply?.ok) {
            if (
              reply?.error?.statusCode === 401 ||
              reply?.error?.statusCode === 403
            )
              this.revoke();
            else this.publish({ status: 'offline', notice: 'connection' });
            return;
          }
          if (!this.accept(reply.data, true)) return;
          if (this.pending) this.send();
        }
      );
  }
  private accept(raw: object | undefined, rejoin = false): boolean {
    if (this.closed || this.state.status === 'revoked') return false;
    const parsed = syncSchema.safeParse(raw);
    if (!parsed.success || parsed.data.board.id !== this.boardId) {
      this.publish({ status: 'offline', notice: 'connection' });
      return false;
    }
    const sync = parsed.data;
    const epochChanged =
      !!this.state.sync && this.state.sync.board.epoch !== sync.board.epoch;
    if (epochChanged) {
      this.pending = undefined;
      this.generation++;
    }
    try {
      if (rejoin || epochChanged) {
        this.doc.destroy();
        this.doc = new Y.Doc();
      }
      Y.applyUpdate(this.doc, decode(sync.binary));
      if (rejoin && this.pending) {
        if (
          this.pending.epoch === sync.board.epoch &&
          sync.capabilities.canEdit
        )
          Y.applyUpdate(this.doc, decode(this.pending.binary));
        else this.pending = undefined;
      }
      this.publish({
        sync,
        shapes: shapesOf(this.doc),
        status: this.pending ? 'saving' : 'ready',
        ...(epochChanged ? { notice: 'epoch' as const } : {}),
      });
      return true;
    } catch {
      this.publish({ status: 'offline', notice: 'connection' });
      return false;
    }
  }
  edit(change: (doc: Y.Doc) => void): boolean {
    if (
      this.closed ||
      this.state.status !== 'ready' ||
      !this.state.sync?.capabilities.canEdit
    )
      return false;
    const candidate = new Y.Doc();
    try {
      Y.applyUpdate(candidate, Y.encodeStateAsUpdate(this.doc));
      const vector = Y.encodeStateVector(candidate);
      candidate.transact(() => change(candidate));
      const update = Y.encodeStateAsUpdate(candidate, vector);
      if (
        update.byteLength > 262144 ||
        candidate.getMap('shapes').size > 2000
      ) {
        this.publish({ notice: 'rejected' });
        return false;
      }
      this.pending = {
        epoch: this.state.sync.board.epoch,
        updateId: newIntentKey(),
        binary: encode(update),
      };
      Y.applyUpdate(this.doc, update);
      this.publish({ status: 'saving', shapes: shapesOf(this.doc) });
      this.send();
      return true;
    } finally {
      candidate.destroy();
    }
  }
  present(viewport: { x: number; y: number; width: number; height: number }) {
    const sync = this.state.sync;
    if (
      this.closed ||
      !this.socket.connected ||
      !sync?.capabilities.canControl ||
      !['ready', 'saving'].includes(this.state.status)
    )
      return;
    this.socket
      .timeout(5000)
      .emit(
        'board:viewport',
        { epoch: sync.board.epoch, viewport },
        (error: Error | null, reply: Reply) => {
          if (this.closed) return;
          if (error || !reply?.ok) this.publish({ notice: 'connection' });
        }
      );
  }
  private send() {
    const pending = this.pending;
    if (!pending || !this.socket.connected) return;
    const generation = this.generation;
    this.socket
      .timeout(10000)
      .emit('board:update', pending, (error: Error | null, reply: Reply) => {
        if (
          this.closed ||
          generation !== this.generation ||
          this.pending !== pending
        )
          return;
        if (error) {
          this.publish({ status: 'offline', notice: 'connection' });
          // Keep this exact update ID for replay after canonical rejoin.
          this.socket.disconnect();
          return;
        }
        if (!reply?.ok) {
          this.pending = undefined;
          if (
            reply?.error?.statusCode === 401 ||
            reply?.error?.statusCode === 403
          )
            this.revoke();
          else {
            this.publish({ notice: 'rejected' });
            this.join();
          }
          return;
        }
        const ack = z
          .object({
            epoch: z.string(),
            updateId: z.string(),
            sequence: z.string(),
          })
          .safeParse(reply.data);
        if (
          !ack.success ||
          ack.data.epoch !== pending.epoch ||
          ack.data.updateId !== pending.updateId
        ) {
          this.publish({ status: 'offline', notice: 'connection' });
          return;
        }
        this.pending = undefined;
        this.publish({ status: 'ready' });
      });
  }
  private revoke() {
    this.pending = undefined;
    this.doc.destroy();
    this.doc = new Y.Doc();
    this.publish({
      status: 'revoked',
      sync: undefined,
      shapes: [],
      people: [],
    });
    this.socket.disconnect();
  }
  close() {
    this.closed = true;
    this.generation++;
    this.pending = undefined;
    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.doc.destroy();
  }
}
