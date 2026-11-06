# Mentor whiteboard integration

Source: `Mindy-BE` remote `origin/dev`, commit `0d87a0f` (checked 2026-11-05).
The local backend `dev` checkout was still at `cc8d843`; no checkout, merge,
migration, configuration or backend code was changed by this task.

This is Mindy's own Yjs whiteboard, not the external Miro REST API. The API
collection exported from the backend is in
`backend.postman_collection.json` (the backend uses Phase 7;
mobile Phase 7 is already used for reports).

## Entry and supported UI

Mentor → class detail → session detail → **Mở bảng tương tác**. GET context is
read-only; board creation requires the explicit button and `canCreate`.
Manager has no entry because the backend only authorizes assigned mentors and
eligible students. The app currently signs in mentors/managers, so no student
route is introduced.

The native canvas supports freehand drawing, sticky notes, text, rectangles,
ellipses, selection/moving, object deletion, color, panning, zoom and fit.
Existing images use short-lived authorized asset access; existing Java/JavaScript
code cards are rendered. Board options switch presentation/collaborative modes,
save snapshots, browse history, preview/restore snapshots and clear content.
Capabilities come from the server. Image/PDF upload and export are separate
backend endpoints; this screen does not expose those operations yet.

## REST contract used

All paths are relative to the configured `API_URL` (`/api/v1`). Authentication
uses native cookies. Writes include the configured allowlisted `API_ORIGIN`.
Command keys are UUIDv4 in `Idempotency-Key`; uncertain retries reuse exactly the
same key and body. New intentions use a new key.

| Method | Path | Input / response |
| --- | --- | --- |
| GET | `/class-sessions/:sessionId/whiteboard` | `{sessionId,board:null\|metadata,context,capabilities}` |
| POST | `/class-sessions/:sessionId/whiteboard` | `{}` → same envelope, 201 |
| PATCH | `/whiteboards/:boardId/control` | `{expectedControlVersion,mode}` → metadata |
| GET | `/whiteboards/:boardId/snapshots` | `page,pageSize` → `{items,total,page,pageSize}` |
| POST | `/whiteboards/:boardId/snapshots` | `{expectedEpoch}` → snapshot summary |
| GET | `/whiteboards/:boardId/snapshots/:snapshotId` | summary + `schemaVersion,projection` |
| POST | `/whiteboards/:boardId/resets` | `{expectedEpoch,expectedSequence,expectedControlVersion}` → metadata, 201 |
| POST | `/whiteboards/:boardId/restores` | reset fields + `snapshotId` → metadata, 201 |
| POST | `/whiteboards/:boardId/assets/:assetId/access` | `{}` → `{url,expiresAt}` |

`sequence` and `controlVersion` remain decimal strings. Metadata and snapshot previews
accept `schemaVersion:1` and `schemaVersion:2`. The backend migration
`1793664000001-whiteboard-shapes.ts` upgrades boards to v2 for rectangle/ellipse/text
support while retaining the same Yjs root. Verified against the deployed context
API on 2026-11-05: HTTP 200 with `schemaVersion:2`.
Reset/restore use the versions captured when the confirmation opened, so edits
that arrive during review cause a conflict instead of being silently overwritten.
403 clears access, `BOARD_DISABLED` explains the unavailable feature, conflict
refetches for review, and uncertain command results retain the original intent.

## Realtime contract

Socket.IO namespace `/`, path `/ws/whiteboards` without a trailing slash,
websocket transport only; cookies plus explicit Origin. It is not y-websocket.

| Event | Payload / result |
| --- | --- |
| `board:join` | `{boardId}` → ACK `{ok:true,data:{board,capabilities,binary,identity}}` |
| `board:update` | `{epoch,updateId,binary}` → durable ACK `{epoch,sequence,updateId}` |
| `board:state` | server's full canonical Yjs state and current capabilities |
| `board:presence` | server-authorized `{people:[{id,name}]}` |
| `board:revoked` | clear document/pending changes and disconnect |

The client allows one in-flight change. Saving is only confirmed by a matching
durable ACK. Timeout locks editing and retains the exact update for replay after
same-epoch canonical rejoin. New epochs discard pending updates with a visible
notice. Rejection reloads the canonical document. Backgrounding disconnects;
returning rejoins. Leaving with an unconfirmed edit prompts the user.

Yjs schema: root `shapes` is `Y.Map<Y.Map>`, IDs are UUIDv4, textual fields are
`Y.Text`. Stroke points are relative to shape `x,y`, matching backend rendering.
Yjs is pinned to 13.6.32. Metro/Jest map lib0's random provider to its browser
implementation, which uses the crypto polyfill already installed at app startup.

## Local validation

- `__tests__/whiteboard.test.ts`: native shared text, relative strokes, ACK gating,
  timeout replay, epoch changes, rejection/revocation, read-only and REST guards.
- `__tests__/whiteboard-ui.test.tsx`: explicit creation, disabled/denied states,
  native note insertion through the joined connection.
- HTTP simulation: `postman simulation run postman/simulations/whiteboard/whiteboard.sim.yaml --port 4317 --no-history`.
  In a separate shell set `WHITEBOARD_SIM_URL=http://localhost:4317/mindy`, then
  run `npx jest --runInBand __tests__/whiteboard-http.test.ts`.
- TypeScript, scoped ESLint/Prettier and Android release JS bundle are checked.

These are local checks. Production `WHITEBOARD_ENABLED`, migrations, WSS proxy,
native cookies against the deployed backend, MinIO assets and multi-device visual
acceptance still require a running backend with this feature enabled.
