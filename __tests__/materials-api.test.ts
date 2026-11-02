import axios from 'axios';
import NetInfo from '@react-native-community/netinfo';
import { createMaterialService } from '@/modules/materials/service';
import {
  materialFixture as m,
  materialId as id,
  fileId,
} from '../__mocks__/materialFixture';
const mentor = { role: 'MENTOR' as const, classId: id },
  manager = { role: 'MANAGER' as const };
function setup(
  extra: Partial<Parameters<typeof createMaterialService>[0]> = {}
) {
  const client = axios.create();
  const request = jest.spyOn(client, 'request');
  const service = createMaterialService({
    baseURL: 'https://api.example.test/api/v1',
    origin: 'https://mobile.example.test',
    client,
    ...extra,
  });
  const reply = (data: object | string | null, status = 200) =>
    request.mockResolvedValueOnce({ data, status });
  return { service, request, reply };
}
beforeEach(() => {
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValue({ isConnected: true } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
});
test('TC-P3-S4-01/07: only chosen status/page; Manager queue cannot request all or draft', async () => {
  const { service, request, reply } = setup();
  reply({ items: [m], total: 45, page: 1, pageSize: 20 });
  expect((await service.list(manager, undefined, 'PENDING_REVIEW')).total).toBe(
    45
  );
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      url: '/manager/materials',
      params: { reviewStatus: 'PENDING_REVIEW', page: 1, pageSize: 20 },
    })
  );
  expect(() => service.list(manager, undefined, '')).toThrow();
  expect(() => service.list(manager, undefined, 'DRAFT')).toThrow();
});
test('TC-P3-S5-02/09: revision and trimmed reason, Origin without attendance idempotency header', async () => {
  const { service, request, reply } = setup();
  reply(m);
  await service.command(manager, id, 'reject', 2, '  Missing answers  ');
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      method: 'POST',
      url: `/manager/materials/${id}/reject`,
      data: { expectedRevision: 2, reason: 'Missing answers' },
      headers: { Origin: 'https://mobile.example.test' },
      withCredentials: true,
    })
  );
  expect(() => service.command(manager, id, 'reject', 2, ' ')).toThrow();
  expect(() =>
    service.command(manager, id, 'reject', 2, 'x'.repeat(2001))
  ).toThrow();
});
test('Role restrictions reject mutations before HTTP', () => {
  const { service, request } = setup();
  expect(() => service.command(mentor, id, 'approve', 2)).toThrow();
  expect(() => service.command(manager, id, 'submit', 2)).toThrow();
  expect(() => service.save(manager, id, {})).toThrow();
  expect(request).not.toHaveBeenCalled();
});
test('TC-P3-S5-17/20/29: conflict, uncertain response and Origin failure have different outcomes', async () => {
  const { service, reply } = setup();
  reply({ code: 'MATERIAL_REVIEW_CONFLICT' }, 409);
  await expect(
    service.command(manager, id, 'approve', 2)
  ).rejects.toMatchObject({ kind: 'conflict' });
  reply('<html>Bad gateway</html>', 503);
  await expect(
    service.command(manager, id, 'approve', 2)
  ).rejects.toMatchObject({ kind: 'uncertain' });
  reply({ code: 'ORIGIN_NOT_ALLOWED', requestId: 'support' }, 403);
  await expect(
    service.command(manager, id, 'approve', 2)
  ).rejects.toMatchObject({
    kind: 'error',
    code: 'ORIGIN_NOT_ALLOWED',
    requestId: 'support',
  });
});
test('TC-P3-S6-06/07: preview pins revision/resource and rejects same-host cookie risk', async () => {
  const { service, reply, request } = setup();
  const body = {
    materialId: id,
    fileId,
    role: 'PRIMARY',
    revision: 2,
    url: 'https://storage.example.test/private',
    expiresAt: '2026-11-02T09:01:00+07:00',
  };
  reply(body);
  await service.access(mentor, id, 2, fileId);
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      params: { expectedRevision: 2 },
      url: `/mentor/classes/${id}/materials/${id}/assets/${fileId}/access`,
    })
  );
  reply({ ...body, revision: 3 });
  await expect(service.access(mentor, id, 2, fileId)).rejects.toMatchObject({
    kind: 'conflict',
  });
  reply({ ...body, url: 'https://api.example.test:9000/object' });
  await expect(service.access(mentor, id, 2, fileId)).rejects.toMatchObject({
    code: 'STORAGE_HOST_UNSAFE',
  });
});
test('TC-P3-S2 upload complete accepts PROCESSING with 202, files do not receive material Origin', async () => {
  const { service, reply, request } = setup();
  reply(
    {
      id: fileId,
      courseUnitId: id,
      status: 'PROCESSING',
      originalFilename: 'p3.pdf',
      declaredSizeBytes: 10,
      sizeBytes: null,
      mimeType: null,
      kind: null,
      intentExpiresAt: '2026-11-02T10:00:00+07:00',
      readyAt: null,
      metadataStatus: null,
      errorCode: null,
    },
    202
  );
  expect((await service.complete(fileId)).status).toBe('PROCESSING');
  expect(request).toHaveBeenLastCalledWith(
    expect.objectContaining({
      url: `/files/${fileId}/complete`,
      data: {},
      headers: {},
    })
  );
});
test('TC-P3-S1-08: malformed enums/metadata cannot become fake empty data', async () => {
  const { service, reply } = setup();
  reply({ ...m, reviewStatus: 'NEW_STATE' });
  await expect(service.detail(mentor, id)).rejects.toMatchObject({
    code: 'INVALID_RESPONSE',
  });
});
test('Session restore happens once; expiry callback fires and stale account cannot receive data', async () => {
  const restore = jest.fn(async () => ({ kind: 'signedOut' as const })),
    onExpired = jest.fn();
  const { service, reply, request } = setup({ restore, onExpired });
  reply({}, 401);
  await expect(service.detail(mentor, id)).rejects.toMatchObject({
    kind: 'denied',
  });
  expect(restore).toHaveBeenCalledTimes(1);
  expect(onExpired).toHaveBeenCalledTimes(1);
  expect(request).toHaveBeenCalledTimes(1);
  const inactive = setup({ isActive: () => false });
  await expect(inactive.service.detail(mentor, id)).rejects.toMatchObject({
    kind: 'denied',
  });
  expect(inactive.request).not.toHaveBeenCalled();
});
test('Offline blocks writes and network failure after send is uncertain without automatic replay', async () => {
  const { service, request } = setup();
  jest
    .mocked(NetInfo.fetch)
    .mockResolvedValueOnce({ isConnected: false } as Awaited<
      ReturnType<typeof NetInfo.fetch>
    >);
  await expect(
    service.command(manager, id, 'approve', 2)
  ).rejects.toMatchObject({ kind: 'offline' });
  expect(request).not.toHaveBeenCalled();
  request.mockRejectedValueOnce(new Error('socket closed'));
  await expect(
    service.command(manager, id, 'approve', 2)
  ).rejects.toMatchObject({ kind: 'uncertain' });
  expect(request).toHaveBeenCalledTimes(1);
});

test('Logout during network preflight prevents the old account request from being sent', async () => {
  let active = true;
  const { service, request } = setup({ isActive: () => active });
  jest.mocked(NetInfo.fetch).mockImplementationOnce(async () => {
    active = false;
    return { isConnected: true } as Awaited<ReturnType<typeof NetInfo.fetch>>;
  });
  await expect(service.detail(mentor, id)).rejects.toMatchObject({
    kind: 'denied',
  });
  expect(request).not.toHaveBeenCalled();
});
test('Malformed successful create response is uncertain and cannot invite a blind duplicate POST', async () => {
  const { service, request, reply } = setup();
  reply({}, 201);
  await expect(
    service.save(mentor, id, {
      contentType: 'ARTICLE',
      title: 'Draft',
      contentText: 'Body',
    })
  ).rejects.toMatchObject({ kind: 'uncertain', code: 'INVALID_RESPONSE' });
  expect(request).toHaveBeenCalledTimes(1);
});
