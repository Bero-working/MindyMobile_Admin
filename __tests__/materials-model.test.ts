import {
  canEdit,
  codePoints,
  stateLabel,
  storageUrl,
  utf8Bytes,
  validateFile,
} from '@/modules/materials/model';
import { materialFixture as m } from '../__mocks__/materialFixture';
test('TC-P3 file policy: MIME inference, 25/200 MiB boundaries, name and kind validation', () => {
  expect(validateFile('worksheet.PDF', 25 * 1024 * 1024, 'FILE')).toMatchObject(
    { mime: 'application/pdf' }
  );
  expect(validateFile('lesson.mp4', 200 * 1024 * 1024, 'VIDEO')).toHaveProperty(
    'mime',
    'video/mp4'
  );
  expect(
    validateFile('lesson.mp4', 200 * 1024 * 1024 + 1, 'VIDEO')
  ).toHaveProperty('error', 'tooLarge');
  expect(
    validateFile('worksheet.pdf', 25 * 1024 * 1024 + 1, 'FILE')
  ).toHaveProperty('error', 'tooLarge');
  expect(validateFile('lesson.mp4', 10, 'FILE')).toHaveProperty(
    'error',
    'wrongType'
  );
  for (const name of ['file.zip', 'image.heic', 'old.doc'])
    expect(validateFile(name, 10, 'FILE')).toHaveProperty(
      'error',
      'unsupported'
    );
  for (const name of [
    ' bad.pdf',
    '../bad.pdf',
    'bad\\name.pdf',
    'bad\u0000.pdf',
  ])
    expect(validateFile(name, 10, 'FILE')).toHaveProperty('error', 'badName');
  expect(validateFile('empty.pdf', 0, 'FILE')).toHaveProperty(
    'error',
    'unreadable'
  );
});
test('TC-P3-S3: firstApprovedAt, canEdit and review status all constrain editing', () => {
  expect(canEdit({ ...m, reviewStatus: 'REJECTED', canEdit: true })).toBe(true);
  expect(
    canEdit({
      ...m,
      reviewStatus: 'DRAFT',
      canEdit: true,
      firstApprovedAt: m.createdAt,
    })
  ).toBe(false);
  expect(canEdit({ ...m, canEdit: true })).toBe(false);
});
test('Published and unpublished are distinct from review status; unicode bytes differ from character count', () => {
  expect(
    stateLabel({ ...m, reviewStatus: 'APPROVED', publishedAt: null })
  ).toBe('unpublished');
  expect(
    stateLabel({ ...m, reviewStatus: 'APPROVED', publishedAt: m.createdAt })
  ).toBe('published');
  expect(codePoints('😀ấ')).toBe(2);
  expect(utf8Bytes('😀ấ')).toBe(7);
});
test('Storage rejects shared hostname across ports, credentials, unsafe protocols and HTTPS downgrade', () => {
  for (const url of [
    'http://api.test:9000/a',
    'file:///tmp/a',
    'https://user:password@storage.test/a',
    'http://storage.test/a',
  ])
    expect(() => storageUrl(url, 'https://api.test')).toThrow();
  expect(storageUrl('https://storage.test/a', 'https://api.test')).toBe(
    'https://storage.test/a'
  );
});
