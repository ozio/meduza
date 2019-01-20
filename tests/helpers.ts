import { isValidTime, isValidURL } from '../src/helpers';

test('Valid time', () => {
  expect(isValidTime('')).toBe(false);
  expect(isValidTime('https://meduza.io/feature/2019/01/18/yaponiya')).toBe(false);
  expect(isValidTime(null)).toBe(false);
  expect(isValidTime(undefined)).toBe(false);
  expect(isValidTime('-15:26')).toBe(false);
  expect(isValidTime('5:-80')).toBe(false);
  expect(isValidTime('12:67')).toBe(false);
  expect(isValidTime('63:1')).toBe(false);
  expect(isValidTime('08:33')).toBe(true);
  expect(isValidTime('21:09')).toBe(true);
  expect(isValidTime('23:59')).toBe(true);
  expect(isValidTime('00:00')).toBe(true);
});

test('Valid URL', () => {
  expect(isValidURL('http://yandex.ru')).toBe(false);
  expect(isValidURL('http://meduza.io/feature/2019/01/18/yaponiya')).toBe(false);
  expect(isValidURL('meduza.io/feature/2019/01/18/yaponiya')).toBe(false);
  expect(isValidURL('/feature/2019/01/18/yaponiya')).toBe(false);
  expect(isValidURL('https://meduza.io/feature/2019/01/18/yaponiya')).toBe(true);
});
