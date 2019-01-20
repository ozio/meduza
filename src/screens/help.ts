import { gold, gray, underline } from '../render';
import settings from '../settings';

export default () => {
  console.log(`
Usage: ${underline(gold('meduza'))} [commands/options]

Commands: ${gray('(you can combine every command with each other)')}

  meduza           \tThe latest news.
  meduza en        \tThe latest news from the english version.
  meduza <type>    \tList of articles by type (default: news).
  meduza <time>    \tArticle by time (24h format, i.e. 15:42).
  meduza <url>     \tArticle by URL.

Options:

  -n, --number <num>\tAmount of news in output (from 1 to 50).
  -e, --exchange   \tCurrent exchange rates.
  -v, --version    \tVersion.
  -h, --help       \tThis help information.
      --no-color   	Without colors.
      --no-logo    	Without the Meduza logo.

Categories:        \t${settings.categories.ru.join(', ')}.`
  );
}
