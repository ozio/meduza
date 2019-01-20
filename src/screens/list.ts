import { Options } from '../types';
import showLogo from '../render/header';

const showList = (options: Options) => {
  showLogo();
  console.log(JSON.stringify(options, null, 2));
};

export default showList;
