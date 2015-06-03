#!/usr/bin/env node

var argv = require('yargs').argv;
var color = require('cli-color');
var restler, moment, cheerio, html2text, wrap;

var i18n = {
  'источник': {
    en: 'source'
  }
};

var gold = function(s) {
  return Meduza.settings.color ? color.xterm(215)(s) : s;
};
var gray = function(s) {
  return Meduza.settings.color ? color.xterm(245)(s) : s;
};
var dark = function(s) {
  return Meduza.settings.color ? color.xterm(237)(s) : s;
};
var underline = function(s) {
  return Meduza.settings.color ? color.underline(s) : s;
};
var bold = function(s) {
  return Meduza.settings.color ? color.bold.white(s) : s;
};

var Meduza = {
  settings: {},
  chronos: {
    news: { ru: 'Новости' },
    cards: { ru: 'Картотека' },
    articles: { ru: 'Истории' },
    shapito: { ru: 'Шапито' },
    polygon: { ru: 'Полигон' }
  },
  spinner: undefined,
  i18n: {
    'источник': 'source'
  },

  translate: function(s) {
    return this.settings.locale === 'en' ? this.i18n[s] || '[' + s + ']' : s;
  },
  parseArgv: function() {
    var settings = {
      help: argv.help || argv.h,
      version: argv.version || argv.v,
      locale: argv.english ? 'en' : 'ru',
      chrono: argv.type || argv.t ? argv.type || argv.t : 'news',
      show: argv.show || argv.s ? argv.show || argv.s : undefined,
      color: !(argv.color === false),
      wrap: 80,
      number: parseInt(argv.number || argv.n)
    };

    if (isNaN(settings.number)) {
      settings.number = 10;
    } else if (settings.number < 1) {
      settings.number = 10;
    } else if (settings.number > 30) {
      settings.number = 30;
    }

    var chronos_arr = Object.keys(this.chronos);

    for (var i = 0, l = argv._.length; i < l; i++) {
      if (argv._[i] === 'en') {
        settings.locale = argv._[i];
      } else if (argv._[i].search(':') > -1) {
        settings.show = argv._[i];
      } else if (chronos_arr.indexOf(argv._[i]) > -1) {
        settings.chrono = argv._[i];
      }
    }

    this.settings = settings;
  },
  showHelp: function() {
    var help =
      '\n' +
      'Usage: ' + underline(gold('meduza')) + ' [commands/options]\n' +
      '\n' +
      'Commands: ' + gray('(you can combine every command with each other)\n') +
      '\n' +
      '  meduza           \tOutput latest news.\n' +
      '  meduza en        \tOutput latest news from english version.\n' +
      '  meduza <time>    \tOutput article by time (i.e. 15:42).\n' +
      '  meduza <type>    \tChoose articles type (default: news). Only one and only in russian.\n' +
      '\n' +
      'Options:\n' +
      '\n' +
      '  -t, --type <type>\tChoose articles type (default: news). Only one and only in russian.\n' +
      '      --english    \tOutput latest news from english version.\n' +
      '  -s, --show <time>\tOutput article by time (i.e. 15:42).\n' +
      '  -n, --number <num>\tNumber of news in output (from 1 to 30).\n' +
      '      --no-color   \tOutput without colors.\n' +
      '  -v, --version    \tDisplay version.\n' +
      '  -h, --help       \tDisplay help information.\n' +
      '\n' +
      'Categories:        \tnews, cards, articles, shapito, polygon.\n';

    console.log(help);
    return true;
  },
  showLogo: function() {
    var logo =
      "\n" +
      "                         @@#`                                \n" +
      "                         @@@@@@;                             \n" +
      " '@@# @@@# @@@:    ;@@.     .#@@+ ;@@  @@@   :@@+    `#@@@'  \n" +
      ":;@@@';@@@;;@@+  @@@'@@; @@@  @@+ ;@@` @@@  `+@@@@     :@@@  \n" +
      "  @@@  @@@  @@+  @@@'@;  @@@  @@+ ;@@` @@@     ,#    ,@#@@@  \n" +
      "  @@@  @@@  @@+  @@@     @@@  @@+ ;@@` @@@    #,   :@@,`@@@  \n" +
      "  @@@  @@@  @@+, @@@     @@@@+@@+ ;@@,,@@@.: @@@@@::@@;,@@@.:\n" +
      "  @@@  @@@ `@@@. #@@@@+   `@@@@   ;@@@ @@@@   #@@@ ,@@@`@@@@ " + gray('v' + require('./package.json').version);

    console.log(gold(logo));
  },
  showVersion: function() {
    console.log(require('./package.json').version);
    return true;
  },
  showDateLine: function(timestamp) {
    var string = '══ ' + moment(timestamp, 'X').format('LL') + ' ';
    var len = this.settings.wrap - string.length;
    string += (new Array(len+1)).join('═');
    console.log('\n' + string + '\n');
  },
  showLeadLine: function() {
    var wrapCharsCount = this.settings.wrap + 1;
    var separator = '  ◆ ◆ ◆  ';
    var isLengthFloat = false;

    var lineLength = (wrapCharsCount - separator.length) / 2;

    if(lineLength !== parseInt(lineLength)) {
      isLengthFloat = true;
    }
    lineLength = parseInt(lineLength) + 1;

    var line = [
      (new Array(lineLength - (isLengthFloat ? 0 : 1))).join('─'),
      separator,
      (new Array(lineLength)).join('─')
    ];

    return dark(line.join(''));
  },
  showArticleShort: function(doc) {
    var time = moment(doc.published_at, 'X').format('H:mm');
    var title = wrap(doc.title);
    var secondTitle = doc.second_title ? wrap(doc.second_title) : null;
    var type = doc.tag ? doc.tag.name : doc.document_type;
    var url = doc.document_type === 'promo' ? doc.promo_url.replace('http://', '') : 'meduza.io/' + doc.url;

    console.log(gray(time) + ' ' + gold(type.toUpperCase()));
    console.log(title);
    if (secondTitle) console.log(secondTitle);
    console.log(dark(url));
  },
  showQuote: function(source) {
    //var line = gray((new Array(this.settings.wrap + 1)).join('·')) + '\n' + gray(text_quot) + '\n' + gray((new Array(this.settings.wrap)).join('·')) + '\n';
    var quoteWrap = require('wordwrap')(this.settings.wrap - 2);

    var wrappedText = quoteWrap(source.quote);
    var sourceText = quoteWrap(source.name.toUpperCase() + ' [' + source.url + ']');
    var resText = '';

    var textArr = wrappedText.split('\n');
    var sourceArr = sourceText.split('\n');

    textArr.push(dark((new Array(this.settings.wrap - 1)).join('─')));

    textArr.forEach(function(item) {
      resText += gold('┃ ') + item + '\n';
    });
// →
    sourceArr.forEach(function(item, idx) {
      resText += gold('┃ ') + (idx > 0 ? '  ' : gold('→ ')) + item + '\n';
    });

    return gray(resText);
  },
  showArticleFull: function(doc) {
    var type = doc.tag.name;
    var title = bold(doc.title);
    var time = moment(doc.published_at, 'X').format('LLL');
    var source = doc.source ? doc.source.name : '';

    var text;

    if(!doc.content.body) {
      text = gray('→ ') + underline(gold(doc.promo_url));
    } else {
      var $ = cheerio.load(doc.content.body);
      var url = doc.document_type !== 'promo' ? 'http://meduza.io/' + doc.url : null;
      var text_lead = wrap(html2text.fromString($('.Lead').html(), { wordwrap: null }));
      var text_body = wrap(html2text.fromString($('.Body').html(), { wordwrap: null }));
      var text_card = wrap(html2text.fromString($('.Card').html(), { wordwrap: null }));
      var text_auth = wrap(html2text.fromString($('.Authors').html(), { wordwrap: null }));

      text =
        (text_lead !== 'null' ? text_lead + '\n\n' + this.showLeadLine() + '\n\n' : '') +
        (text_body !== 'null' ? text_body + '\n\n' : '') +
        (text_card !== 'null' ? text_card + '\n\n' : '') +
        (text_auth !== 'null' ? text_auth + '\n\n' : '') +
        (doc.source && doc.source.quote ? this.showQuote(doc.source) : '');

      var contextEls = $('.Context-item');
      var context = '<ul>';
      contextEls.each(function(idx, el) {
        context += '<li>' + $(el).text() + '</li>';
      });

      context += '</ul>';
      context = html2text.fromString(context);
    }

    console.log(gold(type.toUpperCase()));
    console.log(title);
    console.log(gray(time + (!source || source !== 'Meduza' ? ', ' + this.translate('источник') + ': ' + source : '')));
    console.log('');
    console.log(text.trim());

    if(contextEls && contextEls.length) {
      console.log('');
      console.log(' ' + context);
    }

    console.log(url ? underline(dark('\n' + url + '\n')) : '');
  },
  spinnerShow: function() {
    if (!this.spinner) {
      var Spinner = require('cli-spinner').Spinner;
      this.spinner = new Spinner('%s');
      this.spinner.setSpinnerString('⠁⠁⠉⠙⠚⠒⠂⠂⠒⠲⠴⠤⠄⠄⠤⠠⠠⠤⠦⠖⠒⠐⠐⠒⠓⠋⠉⠈⠈');
      this.spinner.setSpinnerDelay(50);
    }
    this.spinner.start();
  },
  spinnerHide: function() {
    this.spinner.stop(true);
  },
  getArticles: function() {
    this.spinnerShow();
    var _this = this;

    restler
      .get('https://meduza.io/api/v3/search?chrono=' + this.settings.chrono + '&page=0&per_page=' + this.settings.number + '&locale=' + this.settings.locale)
      .on('complete', function(data) {
        _this.spinnerHide();

        var collection = data.collection;
        var documents = data.documents;
        var momentBefore;
        var momentNow;

        if (!_this.settings.show) _this.showLogo();

        for (var i = 0; i < _this.settings.number; i++) {
          var doc = documents[collection[i]];

          if (!_this.settings.show) {
            momentNow = moment(doc.published_at, 'X').format('DDD');
            if (typeof momentBefore === 'undefined' || momentBefore !== momentNow) {
              _this.showDateLine(doc.published_at);
            }

            momentBefore = momentNow;
            _this.showArticleShort(doc);
          } else {
            var time = moment(doc.published_at, 'X').format('H:mm');
            if (time === _this.settings.show) {
              _this.spinnerShow();
              restler.get('https://meduza.io/api/v3/' + doc.url)
                .on('complete', function(data) {
                  _this.spinnerHide();
                  _this.showArticleFull(data.root);
                });
            }
          }
        }
      })
  },

  init: function() {
    this.parseArgv();

    if (this.settings.version) return this.showVersion();
    if (this.settings.help) return this.showHelp();

    wrap = require('wordwrap')(this.settings.wrap);
    html2text = require('html-to-text');
    cheerio = require('cheerio');
    moment = require('moment');
    moment.locale(this.settings.locale);
    restler = require('restler');

    this.getArticles();
  }
};

Meduza.init();

module.exports = Meduza;