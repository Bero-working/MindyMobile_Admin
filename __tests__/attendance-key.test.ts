import { newIntentKey } from '@/modules/attendance/services/intentKey';
test('intent keys use cryptographic random bytes and RFC v4 version/variant', () => {
  const getRandomValues = jest.spyOn(globalThis.crypto, 'getRandomValues');
  const keys = Array.from({ length: 50 }, () => newIntentKey());
  expect(new Set(keys).size).toBe(50);
  expect(getRandomValues).toHaveBeenCalledTimes(50);
  keys.forEach((key) =>
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    )
  );
  getRandomValues.mockRestore();
});
