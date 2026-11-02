import type { Material } from './schema';
export const codePoints = (s: string) => Array.from(s).length;
export const utf8Bytes = (s: string) =>
  Array.from(s).reduce(
    (n, c) =>
      n +
      ((c.codePointAt(0) ?? 0) > 65535
        ? 4
        : (c.codePointAt(0) ?? 0) > 2047
          ? 3
          : (c.codePointAt(0) ?? 0) > 127
            ? 2
            : 1),
    0
  );
export const canEdit = (m: Material) =>
  m.canEdit &&
  m.firstApprovedAt === null &&
  ['DRAFT', 'REJECTED'].includes(m.reviewStatus);
export const stateLabel = (m: Material) =>
  m.reviewStatus === 'APPROVED'
    ? m.publishedAt
      ? 'published'
      : 'unpublished'
    : m.reviewStatus;
const mime: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  mp3: 'audio/mpeg',
  mp4: 'video/mp4',
  txt: 'text/plain',
  md: 'text/markdown',
  csv: 'text/csv',
  json: 'application/json',
  js: 'text/javascript',
  css: 'text/css',
  ts: 'text/plain',
  py: 'text/plain',
  java: 'text/plain',
  c: 'text/plain',
  cpp: 'text/plain',
  h: 'text/plain',
  sql: 'text/plain',
};
export function validateFile(
  name: string,
  size: number | null,
  type: 'FILE' | 'VIDEO'
) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (
    !name ||
    name.length > 250 ||
    name.trim() !== name ||
    /[\p{Cc}\\/]/u.test(name)
  )
    return { error: 'badName' } as const;
  if (!size || !Number.isSafeInteger(size) || size < 1)
    return { error: 'unreadable' } as const;
  if (!mime[ext]) return { error: 'unsupported' } as const;
  if ((type === 'VIDEO') !== (ext === 'mp4'))
    return { error: 'wrongType' } as const;
  if (size > (type === 'VIDEO' ? 200 : 25) * 1024 * 1024)
    return { error: 'tooLarge' } as const;
  return { mime: mime[ext], size } as const;
}
export function storageUrl(url: string, apiURL: string) {
  const target = new URL(url),
    api = new URL(apiURL);
  // Native cookie jars are shared across ports. Refuse same-host private storage.
  if (
    !['http:', 'https:'].includes(target.protocol) ||
    target.username ||
    target.password ||
    target.hostname === api.hostname ||
    (api.protocol === 'https:' && target.protocol !== 'https:')
  )
    throw new Error('STORAGE_HOST_UNSAFE');
  return url;
}
export const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
export const plainArticleHtml = (s: string) =>
  `<p>${escapeHtml(s).replace(/\r\n?/g, '\n').replace(/\n/g, '<br>')}</p>`;
