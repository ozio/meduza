# Meduza [<3](https://meduza.io/shapito/2015/06/02/vyshel-neofitsialnyy-terminalnyy-klient-meduzy)

Simple Meduza(meduza.io) terminal client. 

## Installation

    $ npm install -g meduza

## Usage

```
Usage: meduza [commands/options]

Commands: (you can combine every command with each other)

  meduza           	Output latest news.
  meduza en        	Output latest news from english version.
  meduza <time>    	Output article by time (i.e. 15:42).
  meduza <type>    	Choose articles type (default: news). Only one and only in russian.

Options:

  -t, --type <type>	Choose articles type (default: news). Only one and only in russian.
      --english    	Output latest news from english version.
  -s, --show <time>	Output article by time (i.e. 15:42).
  -n, --number <num>	Number of news in output (from 1 to 30).
      --no-color   	Output without colors.
  -v, --version    	Display version.
  -h, --help       	Display help information.

Categories:        	news, cards, articles, shapito, polygon.
```

## License

MIT © [Nikolay Solovyov](http://ozio.io)