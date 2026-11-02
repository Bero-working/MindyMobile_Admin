import axios, { type AxiosInstance } from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { z } from 'zod';
import { env } from '@/config/env';
import { appConfig } from '@/config/app';
import type { AuthService } from '@/modules/auth/types';
import * as wire from './schema';
import { storageUrl } from './model';
export class MaterialError extends Error {
  constructor(
    readonly kind:
      | 'error'
      | 'offline'
      | 'denied'
      | 'notFound'
      | 'conflict'
      | 'uncertain',
    readonly code = '',
    readonly requestId = ''
  ) {
    super(code || kind);
  }
}
export type Scope = { role: wire.Role; classId?: string | undefined };
export type Draft = {
  title?: string;
  description?: string | null;
  contentType?: 'FILE' | 'VIDEO' | 'ARTICLE';
  fileId?: string;
  contentText?: string;
  contentHtml?: string;
  expectedRevision?: number;
};
type Options = {
  baseURL?: string | undefined;
  origin?: string | undefined;
  client?: AxiosInstance;
  restore?: AuthService['restore'];
  onExpired?: () => void;
  isActive?: () => boolean;
};
export function createMaterialService({
  baseURL = env.API_URL,
  origin = env.API_ORIGIN,
  client = axios.create(),
  restore,
  onExpired,
  isActive = () => true,
}: Options = {}) {
  let renewing: ReturnType<AuthService['restore']> | undefined;
  const resource = (value: string | undefined) => {
    if (!wire.id.safeParse(value).success)
      throw new MaterialError('error', 'INVALID_RESOURCE');
    return encodeURIComponent(value!);
  };
  const prefix = (s: Scope) =>
    s.role === 'MANAGER'
      ? '/manager/materials'
      : `/mentor/classes/${resource(s.classId)}/materials`;
  async function request(
    url: string,
    method = 'GET',
    params: Record<string, string | number> = {},
    data?: object
  ): Promise<object | string | null> {
    if (!isActive()) throw new MaterialError('denied');
    if (!baseURL) throw new MaterialError('error', 'CONFIG');
    const write = method !== 'GET';
    const materialWrite = write && !url.startsWith('/files/');
    if (materialWrite && !origin)
      throw new MaterialError('error', 'ORIGIN_NOT_CONFIGURED');
    const network = await NetInfo.fetch();
    if (network.isConnected === false || network.isInternetReachable === false)
      throw new MaterialError('offline');
    const config = {
      baseURL: baseURL.replace(/\/+$/, ''),
      url,
      method,
      params,
      ...(data ? { data } : {}),
      headers: materialWrite ? { Origin: origin! } : {},
      timeout: appConfig.api.timeout,
      withCredentials: true,
      validateStatus: () => true,
    };
    const send = async () => {
      if (!isActive()) throw new MaterialError('denied');
      try {
        return await client.request<object | string | null>(config);
      } catch {
        throw new MaterialError(write ? 'uncertain' : 'error', 'NETWORK');
      }
    };
    let response = await send();
    if (!isActive()) throw new MaterialError('denied');
    if (response.status === 401 && restore) {
      renewing ??= restore().finally(() => {
        renewing = undefined;
      });
      const result = await renewing;
      if (!isActive()) throw new MaterialError('denied');
      if (result.kind === 'user') response = await send();
      else if (result.kind === 'signedOut') {
        onExpired?.();
        throw new MaterialError('denied');
      } else
        throw new MaterialError(
          result.error.code === 'offline' ? 'offline' : 'error',
          'AUTH_REFRESH'
        );
    }
    if (!isActive()) throw new MaterialError('denied');
    if (response.status === 401) onExpired?.();
    if (response.status < 200 || response.status >= 300) {
      const error = z
        .object({
          code: z.string().optional(),
          requestId: z.string().optional(),
        })
        .safeParse(response.data);
      const code = error.success ? (error.data.code ?? '') : '';
      throw new MaterialError(
        response.status === 401 ||
          (response.status === 403 && code !== 'ORIGIN_NOT_ALLOWED')
          ? 'denied'
          : response.status === 404
            ? 'notFound'
            : response.status === 409 && code === 'MATERIAL_REVIEW_CONFLICT'
              ? 'conflict'
              : write && response.status >= 500
                ? 'uncertain'
                : 'error',
        code,
        error.success ? error.data.requestId : undefined
      );
    }
    return response.data;
  }
  const parse = async <T>(
    schema: z.ZodType<T>,
    value: Promise<object | string | null>,
    write = false
  ): Promise<T> => {
    const body = await value;
    const result = schema.safeParse(body);
    if (!result.success)
      throw new MaterialError(
        write ? 'uncertain' : 'error',
        'INVALID_RESPONSE'
      );
    return result.data;
  };
  return {
    names: async () => {
      const collect = async (url: string, key: 'name' | 'displayName') => {
        const names: Record<string, string> = {};
        const row = z.object({
          id: wire.id,
          name: z.string().optional(),
          displayName: z.string().nullable().optional(),
        });
        const schema = z.object({
          items: z.array(row),
          total: z.number().int().nonnegative(),
        });
        for (let page = 1; ; page++) {
          const value = await parse(
            schema,
            request(url, 'GET', { page, pageSize: 100 })
          );
          for (const item of value.items)
            if (item[key]) names[item.id] = item[key]!;
          if (page * 100 >= value.total) return names;
          if (!value.items.length)
            throw new MaterialError('error', 'INVALID_PAGE');
        }
      };
      const [classes, mentors] = await Promise.allSettled([
        collect('/manager/classes', 'name'),
        collect('/manager/mentors', 'displayName'),
      ]);
      return {
        classes: classes.status === 'fulfilled' ? classes.value : {},
        mentors: mentors.status === 'fulfilled' ? mentors.value : {},
      };
    },
    list: (
      s: Scope,
      unitId: string | undefined,
      reviewStatus: string,
      page = 1,
      pageSize = 20
    ) => {
      if (
        !Number.isInteger(page) ||
        page < 1 ||
        !Number.isInteger(pageSize) ||
        pageSize < 1 ||
        pageSize > 100 ||
        (reviewStatus && !wire.status.safeParse(reviewStatus).success)
      )
        throw new MaterialError('error', 'INVALID_FILTER');
      if (
        s.role === 'MANAGER' &&
        !['PENDING_REVIEW', 'APPROVED', 'REJECTED'].includes(reviewStatus)
      )
        throw new MaterialError('error', 'INVALID_FILTER');
      return parse(
        wire.page,
        request(
          s.role === 'MANAGER'
            ? prefix(s)
            : `/mentor/classes/${resource(s.classId)}/units/${resource(unitId)}/materials`,
          'GET',
          { page, pageSize, ...(reviewStatus ? { reviewStatus } : {}) }
        )
      );
    },
    detail: async (s: Scope, materialId: string) => {
      const m = await parse(
        wire.detail,
        request(`${prefix(s)}/${resource(materialId)}`)
      );
      if (m.id !== materialId)
        throw new MaterialError('error', 'RESOURCE_MISMATCH');
      return m;
    },
    save: (s: Scope, unitId: string, body: Draft, materialId?: string) => {
      if (s.role !== 'MENTOR') throw new MaterialError('denied');
      return parse(
        wire.detail,
        request(
          materialId
            ? `${prefix(s)}/${resource(materialId)}`
            : `/mentor/classes/${resource(s.classId)}/units/${resource(unitId)}/materials`,
          materialId ? 'PATCH' : 'POST',
          {},
          body
        ),
        true
      );
    },
    command: (
      s: Scope,
      materialId: string,
      action: 'submit' | 'approve' | 'reject',
      revision: number,
      reason?: string
    ) => {
      if ((s.role === 'MENTOR') !== (action === 'submit'))
        throw new MaterialError('denied');
      if (
        !Number.isInteger(revision) ||
        revision < 1 ||
        (action === 'reject' &&
          (!reason?.trim() || Array.from(reason.trim()).length > 2000))
      )
        throw new MaterialError('error', 'INVALID_INPUT');
      return parse(
        wire.detail,
        request(
          `${prefix(s)}/${resource(materialId)}/${action}`,
          'POST',
          {},
          {
            expectedRevision: revision,
            ...(action === 'reject' ? { reason: reason!.trim() } : {}),
          }
        ),
        true
      );
    },
    access: async (
      s: Scope,
      materialId: string,
      revision: number,
      fileId?: string
    ) => {
      const result = await parse(
        wire.access,
        request(
          `${prefix(s)}/${resource(materialId)}/${fileId ? `assets/${resource(fileId)}/access` : 'preview'}`,
          'GET',
          { expectedRevision: revision }
        )
      );
      if (
        result.materialId !== materialId ||
        result.revision !== revision ||
        (fileId && result.fileId !== fileId)
      )
        throw new MaterialError('conflict', 'RESOURCE_MISMATCH');
      try {
        storageUrl(result.url, baseURL ?? '');
      } catch {
        throw new MaterialError('error', 'STORAGE_HOST_UNSAFE');
      }
      return result;
    },
    uploadIntent: (body: {
      courseUnitId: string;
      classId: string;
      classUnitId: string;
      originalFilename: string;
      declaredMimeType: string;
      declaredSizeBytes: number;
    }) =>
      parse(wire.intent, request('/files/upload-intents', 'POST', {}, body)),
    complete: (fileId: string) =>
      parse(
        wire.fileStatus,
        request(`/files/${resource(fileId)}/complete`, 'POST', {}, {})
      ),
    file: (fileId: string) =>
      parse(wire.fileStatus, request(`/files/${resource(fileId)}`)),
    storageUrl: (url: string) => storageUrl(url, baseURL ?? ''),
  };
}
export type MaterialService = ReturnType<typeof createMaterialService>;
