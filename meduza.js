#!/usr/bin/env node

// TODO: open in browser
// TODO: show news in minutes

var argv = require('yargs').argv;
var clc = require('cli-color');

var i18n = {
  'источник': {
    en: 'source'
  }
};
var m = function(s, color) {
  if (!color) color = 215;
  return clc.xterm(color)(s)
};
var t = function(s) {
  if (settings.locale === 'ru') return s;
  if (i18n[s] && i18n[s].en) return i18n[s].en;

  return 'i18n?'
};

var chronos = {
  news: { ru: 'Новости' },
  cards: { ru: 'Картотека' },
  articles: { ru: 'Истории' },
  shapito: { ru: 'Шапито' },
  polygon: { ru: 'Полигон' }
};
var chronos_arr = Object.keys(chronos);

function showHelp() {

  console.log(
    '\n' +
    'Usage: ' + m('meduza') + ' [commands/options]\n' +
    '\n' +
    'Commands: (you can combine every command with other)\n' +
    '\n' +
    '  meduza          \tOutput latest news.\n' +
    '  meduza en       \tOutput latest news from english version.\n' +
    '  meduza <time>   \tOutput article by time (i.e. 15:42).\n' +
    '  meduza <type>   \tChoose articles type (default: news). Only one and only in russian.\n' +
    '\n' +
    'Options:\n' +
    '\n' +
    '  -t, --type <type>\tChoose articles type (default: news). Only one and only in russian.\n' +
    '      --english   \tOutput latest news from english version.\n' +
    '  -s, --show <time>\tOutput article by time (i.e. 15:42).\n' +
    '  -v, --version   \tDisplay version.\n' +
    '  -h, --help      \tDisplay help information.\n' +
    '\n' +
    'List of categories:\tnews, cards, articles, shapito, polygon.\n'
  );

}

function showVersion() {
  console.log(pjson.version);
}

function showLogo() {
  var logo =
    '                         @@#`                                \n' +
    '                         @@@@@@;                             \n' +
    ' \'@@# @@@# @@@:    ;@@.     .#@@+ ;@@  @@@   :@@+    `#@@@\'  \n' +
    ':;@@@\';@@@;;@@+  @@@\'@@; @@@  @@+ ;@@` @@@  `+@@@@     :@@@  \n' +
    '  @@@  @@@  @@+  @@@\'@;  @@@  @@+ ;@@` @@@     ,#    ,@#@@@  \n' +
    '  @@@  @@@  @@+  @@@     @@@  @@+ ;@@` @@@    #,   :@@,`@@@  \n' +
    '  @@@  @@@  @@+, @@@     @@@@+@@+ ;@@,,@@@.: @@@@@::@@;,@@@.:\n' +
    '  @@@  @@@ `@@@. #@@@@+   `@@@@   ;@@@ @@@@   #@@@ ,@@@`@@@@ \n';

  console.log(m(logo));
}

if (argv.help || argv.h) {
  showHelp();
  return;
}

if (argv.version || argv.v) {
  var pjson = require('./package.json');
  showVersion();
  return;
}

var settings = {
  locale: argv.english ? 'en' : 'ru',
  chrono: argv.type || argv.t ? argv.type || argv.t : 'news',
  show: argv.show || argv.s ? argv.show || argv.s : undefined,
  wrap: 80
};

for (var i = 0, l = argv._.length; i < l; i++) {
  if (argv._[i] === 'en') {
    settings.locale = argv._[i];
  } else if (argv._[i].search(':') > -1) {
    settings.show = argv._[i];
  } else if (chronos_arr.indexOf(argv._[i]) > -1) {
    settings.chrono = argv._[i];
  }
}

//console.log('Debug: ' + JSON.stringify(settings, null, 2));

var restler = require('restler');
var moment = require('moment');
var html2text = require('html-to-text');
var cheerio = require('cheerio');
var wrap = require('wordwrap')(settings.wrap);

moment.locale(settings.locale);

function showShort(doc) {
  var time = moment(doc.published_at, 'X').format('H:mm');
  var title = wrap(doc.title);
  var secondTitle = doc.second_title ? wrap(doc.second_title) : null;
  var type = doc.tag ? doc.tag.name : doc.document_type;
  var url = 'meduza.io/' + doc.url;

  console.log(clc.xterm(245)(time) + ' ' + clc.xterm(215)(type.toUpperCase()));
  console.log(title);
  if (secondTitle) console.log(secondTitle);
  console.log(clc.underline.xterm(237)(url));
}

function showFull(doc) {
  var type = doc.tag.name;
  var title = doc.title;
  var time = moment(doc.published_at, 'X').format('LLL');
  var source = doc.source.name;

  $ = cheerio.load(doc.content.body);

  var text = wrap(html2text.fromString($('.Body').html(), {
    wordwrap: null
  }));

  var contextEls = $('.Context-item');
  var context = '<ul>';
  contextEls.each(function(idx, el) {
    context += '<li>' + $(el).text() + '</li>';
  });

  context += '</ul>';
  context = html2text.fromString(context);

  console.log(clc.xterm(215)(type.toUpperCase()));
  console.log(clc.xterm(255)(title));
  console.log(clc.xterm(240)(time + (source !== 'Meduza' ? ', ' + t('источник') + ': ' + source : '')));
  console.log('');
  console.log(text.replace('\n\n\n', '\n').replace('\n\n', '\n'));
  console.log('');
  console.log(' ' + context);
  console.log('');
}

function showLine(timestamp) {
  var string = '══ ' + moment(timestamp, 'X').format('LL') + ' ';
  var len = settings.wrap - string.length;

  string += (new Array(len)).join('═');

  console.log(string + '\n');
}

restler
  .get('https://meduza.io/api/v3/search?chrono=' + settings.chrono + '&page=0&per_page=10&locale=' + settings.locale)
  .on('complete', function(data) {
    var collection = data.collection;
    var documents = data.documents;
    var momentBefore;
    var momentNow;

    if (!settings.show) showLogo();

    for (var i = 0, l = collection.length; i < l; i++) {
      var doc = documents[collection[i]];

      if (!settings.show) {
        momentNow = moment(doc.published_at, 'X').format('DDD');
        if(typeof momentBefore === 'undefined' || momentBefore !== momentNow) {
          showLine(doc.published_at);
        }
        momentBefore = momentNow;
        showShort(doc);
      } else {
        var time = moment(doc.published_at, 'X').format('H:mm');
        if (time === settings.show) {
          restler.get('https://meduza.io/api/v3/' + doc.url).on('complete', function(data) {
            showFull(data.root);
          });
        }
      }
    }
  });
