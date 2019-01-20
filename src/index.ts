import parseArguments from './cli';
import showHelp from './screens/help';
import showVersion from './screens/version';
import showList from './screens/list';

const meduza = () => {
  const options = parseArguments(process.argv.slice(2));

  if (options.action === 'help') {
    return showHelp();
  }

  if (options.action === 'version') {
    return showVersion();
  }

  if (options.action === 'exchange') {

  }

  if (options.action === 'index') {
    return showList(options);
  }

  console.log(options);
};

meduza();
