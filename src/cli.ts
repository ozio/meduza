// ----------------------------------
// meduza               -- get list of latest news.
// meduza <category>    -- get list of latest news by category (news, articles, razbor, games, shapito, podcasts).
// meduza <time>        -- get article by time (24h format: 15:41).
// meduza <url>         -- get article by URL.
// meduza en <category> -- get list of latest news by category (news, articles, shapito).
// meduza en <time>     -- get article by time (24h format: 15:41).
// meduza en <url>      -- get article by URL.
// ----------------------------------
//     --no-color
//     --no-logo
// -e, --exchange
// -h, --help
// -v, --version
// -n, --number <1:30>
// TODO: -s, --search <query>

import getopts from 'getopts';
import settings from './settings';
import { isValidTime, isValidURL } from './helpers';
import { Options } from './types';

console.log(process.env.ITERM_SESSION_ID);

const parseArguments = (args: string[]): Options => {
  const options: Options = {
    language: 'ru',
    action: 'index',
  };

  const opts = getopts(args, {
    alias: {
      h: 'help',
      e: 'exchange',
      v: 'version',
      n: 'number',
    }
  });

  if (opts.help) options.action = 'help';
  if (opts.exchange) options.action = 'exchange';
  if (opts.version) options.action = 'version';

  opts._.forEach(key => {
    if (key === 'en') {
      options.language = 'en';
    }

    if (settings.categories[options.language].includes(key)) {
      options.action = 'category';
      options.payload = { category: key };
    }

    if (isValidTime(key)) {
      options.action = 'time';
      options.payload = { time: key };
    }

    if (isValidURL(key)) {
      options.action = 'url';
      options.payload = { url: key };
    }
  });

  if (opts.color === false) {
    if (!options.props) options.props = {};

    options.props.noColor = true;
  }

  if (opts.logo === false) {
    if (!options.props) options.props = {};

    options.props.noLogo = true;
  }

  if (opts.number) {
    if (!options.props) options.props = {};

    options.props.number = opts.number;

    if (opts.number < 0) options.props.number = 0;
    if (opts.number > settings.maximumItemsInList) options.props.number = settings.maximumItemsInList;
  }

  return options;
};

export default parseArguments;
