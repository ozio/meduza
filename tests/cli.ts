import parseArguments from '../src/cli';

const pa = (args: string) => parseArguments(args.split(' '));

test('Simple options', () => {
  expect(pa('--help')).toMatchObject({
    language: 'ru',
    action: 'help',
  });

  expect(pa('--h')).toMatchObject({
    language: 'ru',
    action: 'help',
  });

  expect(pa('--exchange')).toMatchObject({
    language: 'ru',
    action: 'exchange',
  });

  expect(pa('--e')).toMatchObject({
    language: 'ru',
    action: 'exchange',
  });

  expect(pa('en --exchange')).toMatchObject({
    language: 'en',
    action: 'exchange',
  });

  expect(pa('--version')).toMatchObject({
    language: 'ru',
    action: 'version',
  });

  expect(pa('en --v')).toMatchObject({
    language: 'en',
    action: 'version',
  });
});

test('Category options', () => {
  expect(pa('news')).toMatchObject({
    language: 'ru',
    action: 'category',
    payload: { category: 'news' },
  });

  expect(pa('en articles')).toMatchObject({
    language: 'en',
    action: 'category',
    payload: { category: 'articles' },
  });
});

test('Time options', () => {
  expect(pa('14:54')).toMatchObject({
    language: 'ru',
    action: 'time',
    payload: { time: '14:54' },
  });
});

test('URL options', () => {
  expect(pa('14:54')).toMatchObject({
    language: 'ru',
    action: 'time',
    payload: { time: '14:54' },
  });
});

test('Props options', () => {
  expect(pa('--no-color --no-logo --number 15')).toMatchObject({
    language: 'ru',
    action: 'index',
    props: {
      noColor: true,
      noLogo: true,
      number: 15,
    },
  });

  expect(pa('--number one')).toMatchObject({
    language: 'ru',
    action: 'index',
  });
});
