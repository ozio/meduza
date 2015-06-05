#!/usr/bin/env node

// TODO: подписка на вечернюю медузу
// TODO: стриминг

var argv = require('yargs').argv;
var color = require('cli-color');
var restler, moment, cheerio, html2text, wrap;

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
var center = function(s) {
  var lines = s.split('\n');

  lines = lines.map(function(line) {
    var len = line.length;
    var paddingLength = parseInt((80 - len) / 2) + 1;
    var padding = (new Array(paddingLength)).join(' ');

    return padding + line;
  });

  return lines.join('\n');
};

var urlRegex = new RegExp(new RegExp( /* https://gist.github.com/dperini/729294 */
    // protocol identifier
  '(?:(?:https?|ftp)://)' +
    // user:pass authentication
  '(?:\\S+(?::\\S*)?@)?' +
  '(?:' +
    // IP address exclusion
    // private & local networks
  '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
  '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
  '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broacast addresses
    // (first & last IP address of each class)
  '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
  '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
  '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
  '|' +
    // host name
  '(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)' +
    // domain name
  '(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*' +
    // TLD identifier
  '(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))' +
  ')' +
    // port number
  '(?::\\d{2,5})?' +
    // resource path
  '(?:/[^ \\f\\n\\r\\t\\v\​\u00a0\\u1680\​\u180e\\u2000-\\u200a\​\u2028\\u2029​\\u202f\\u205f\​\u3000\\]]*)?', 'g'));
var bracketsRegex = new RegExp('\\[\\d+\\]', 'g');

var replaceUrls = function(html, arr) {
  return html.replace(urlRegex, function(link) {
    var isSpaned = false;
    if (link.search('"><span') > -1) isSpaned = true;
    arr.push(link.replace('"><span', ''));
    return arr.length + (isSpaned ? '"><span' : '');
  });
};
var replaceBrackets = function(html) {
  return html.replace(bracketsRegex, function(brackets) {
    return gold(brackets);
  });
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
      "                          ██▄                                  \n" +
      "                          ██████▄                              \n" +
      "   ▄█░ ▄██░ ▄██░    ▄██       ▀██░  ███░ ███░  ▄██▄     ▄███░  \n" +
      "  ▀███░▀███░▀██░  ███░██░ ██░  ██░  ███░ ███░  ▀████░    ▄███░ \n" +
      "   ███░ ███░ ██░  ███░█░  ██░  ██░  ███░ ███░    ▄▀    ▄█▀███░ \n" +
      "   ███░ ███░ ██░  ███░    ██░  ██░  ███░ ███░   ▄▀    ██░ ███░ \n" +
      "   ███░ ███░ ██░  ███░    ███░ ██░  ███░ ███░  █████░ ██░ ███░ \n" +
      "   ███░ ███░ ███░ ▀████░   ▀████░   ▀███▀███▀   ▀███░ ███▀████░  " + gray('v' + require('./package.json').version);

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
  showLine: function(separator, color) {
    var wrapCharsCount = this.settings.wrap + 1;
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

    return color(line.join(''));
  },
  showArticleShort: function(doc) {
    var time = moment(doc.published_at, 'X').format('H:mm');
    var title = wrap(doc.title);
    var secondTitle = doc.second_title ? wrap(doc.second_title) : null;
    var type = doc.tag ? doc.tag.name : doc.document_type;
    var url = doc.document_type === 'promo' ? doc.promo_url.replace('http://', '') : 'https://meduza.io/' + doc.url;

    console.log(gray(time) + ' ' + gold(type.toUpperCase()));
    console.log(title);
    if (secondTitle) console.log(secondTitle);
    console.log(dark(url));
  },
  showQuote: function(source, urls) {
    //var line = gray((new Array(this.settings.wrap + 1)).join('·')) + '\n' + gray(text_quot) + '\n' + gray((new Array(this.settings.wrap)).join('·')) + '\n';
    var quoteWrap = require('wordwrap')(this.settings.wrap - 2);

    var wrappedText = quoteWrap(source.quote);
    var sourceText = quoteWrap(source.name.toUpperCase() + ' [' + replaceUrls(source.url, urls) + ']');
    var resText = '';

    var textArr = wrappedText.split('\n');
    var sourceArr = sourceText.split('\n');

    textArr.push(dark((new Array(this.settings.wrap - 1)).join('─')));

    textArr.forEach(function(item) {
      resText += gold('┃ ') + item + '\n';
    });
// →
    sourceArr.forEach(function(item, idx) {
      resText += gold('┃ ') + (idx > 0 ? '  ' : gold('→ ')) + replaceBrackets(item) + '\n';
    });

    return gray(resText.trim());
  },
  showContext: function(dom, $, urls) {
    var context = '<ul>';
    dom.each(function(idx, el) {
      context += '<li>' + replaceUrls($(el).text(), urls) + '<br></li>';
    });
    context += '</ul>';

    return context;
  },
  showCards: function(doc, dom, urls) {
    var article = [];

    for(i = 0; i < doc.chapters_count; i++) {
      article.push(this.showLine('  ' + ((i+1) < 10 ? '0' + (i+1) : (i+1)) + '  ', gold));
      article.push(bold(center(wrap(doc.table_of_contents[i]))));
      article.push(
        replaceBrackets(
          wrap(
            replaceUrls(
              html2text.fromString(
                dom.eq(i), { wordwrap: null }
              ),
              urls
            )
          )
        )
      );
    }

    return article.join('\n\n')
  },
  showLinks: function(arr) {
    var res = [];
    var links = '';

    arr.forEach(function(item, idx) {
      links += '[' + (idx + 1) + '] – ' + underline(item) + '\n';
    });

    return this.showLine('', dark) + '\n' + gray(links.trim());
  },
  showRelated: function(dom, arr) {
    var res = [];

    var head = bold('Читайте также:');
    var html = '<ul>' + dom.replace('<ul></ul>', '') + '</ul>';
    html = replaceBrackets(html2text.fromString(
        replaceUrls(
          html, arr
        )
      )
    );

    res.push(head);
    res.push(' ' + html);

    return res.join('\n\n');
  },
  showArticleFull: function(doc) {
    var type = doc.tag ? doc.tag.name : doc.document_type;
    var title = bold(wrap(doc.title));
    var second_title = doc.second_title ? wrap(doc.second_title) : doc.second_title;
    var time = moment(doc.published_at, 'X').format('LLL');
    var source = doc.source ? doc.source.name : '';
    var url = 'https://meduza.io/' + doc.url;
    var urls = [];

    var text;
    var $ = cheerio.load(doc.content.body);

    var compileString = (function(html) {
      return replaceBrackets(
        wrap(
          replaceUrls(
            html2text.fromString(html, { wordwrap: null }), urls
          )
        )
      );
    }).bind(this);

    var dom = {
      lead: $('.Lead'),
      body: $('.Body'),
      related: $('.Related ul'),
      cards: $('.CardChapter-body'),
      authors: $('.Authors'),
      context: $('.Context-item')
    };

    dom.body.find('.Related').remove(); // смотреть также вынесено в отдельный блок
    dom.body.find('.Figure').remove(); // убрал вообще, потому что картинки в консоли не видны, а подписи ломают текст
    dom.body.find('.Embed').remove(); // то же самое и для видео

    var article = [];

    switch (doc.document_type) {
      case 'promo':
        url = doc.promo_url;
        article.push(gray('→ ') + underline(gold(url)));
        break;

      case 'card':
        article.push(this.showCards(doc, dom.cards, urls));
        if(urls.length) article.push(this.showLinks(urls));
        break;

      default:
        if (dom.lead.length) article.push(compileString(dom.lead.html()), this.showLine('  ◆ ◆ ◆  ', dark));
        if (dom.body.length) article.push(compileString(dom.body.html()));
        if (dom.authors.length) article.push(compileString(dom.authors.html()));
        if (doc.source && doc.source.quote) article.push(this.showQuote(doc.source, urls));
        if (dom.context.length) article.push(' ' + html2text.fromString(this.showContext(dom.context, $, urls), { wordwrap: this.settings.wrap }));
        if (dom.related.length) article.push(this.showRelated(dom.related.html(), urls));

        if(urls.length) article.push(this.showLinks(urls));

        break;
    }

    console.log(gold(type.toUpperCase()));
    console.log(title);
    if (second_title) console.log(second_title);
    console.log(gray(time + (!source || source !== 'Meduza' ? ', ' + this.translate('источник') + ': ' + source : '')));
    console.log('');
    console.log(article.join('\n\n').trim());

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

          if (!doc) return;

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