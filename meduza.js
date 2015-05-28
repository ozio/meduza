#!/usr/bin/env node

var restler = require('restler');
var moment = require('moment');
var clc = require('cli-color');
var argv = require('yargs').argv;
var html2text = require('html-to-text');
var cheerio = require('cheerio');
var wrap = require('wordwrap')(80);

for (var i = 0, l = argv._.length; i < l; i++) {
  if (argv._[i] === 'en') {
    argv.locale = argv._[i];
  } else if (argv._[i].search(':')) {
    argv.show = argv._[i];
  } // TODO: Запилить поддержку указания только минуты, без часа.
}

var settings = {
  locale: argv.locale || argv.l ? argv.locale || argv.l : 'ru',
  chrono: argv.chrono || argv.c ? argv.chrono || argv.c : 'news',
  show:   argv.show || argv.s ? argv.show || argv.s : false,
  help:   !!(argv.help || argv.h)
};

moment.locale(settings.locale);

function showHelp() {
  var m = function(s) {
    return clc.xterm(215)(s)
  };

  console.log(
    '\n' +
    'Usage: ' + m('meduza') + ' [COMMANDS] [options]\n' +
    '\n' +
    'Commands:\n' +
    '\n' +
    '  meduza          \tOutput latest news in russian version.\n' +
    '  meduza en       \tOutput latest news on english version.\n' +
    '  meduza <time>   \tOutput article by time in russian version (i.e. 15:42).\n' +
    '  meduza en <time>\tOutput article by time in english version.\n' +
    '\n' +
    'Options:\n' +
    '\n' +
    '  -c, --chrono    \tSelect type. Default: ' + m('news') + ', can be ' + m('feature') + ', ' + m('cards') + ',\n' +
    '                  \t' + m('galleries') + ', ' + m('promo') + ', ' + m('shapito') + ' and ' + m('quiz') + '.\n' +
    '  -l, --locale    \tAlternative variant of locale selection.\n' +
    '  -h, --help      \tDisplay help information.\n'
  );

  console.log();
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

  console.log(clc.xterm(215)(logo));
}

function showShort(doc) {
  var time = moment(doc.published_at, 'X').format('H:mm');
  var title = doc.title;
  var secondTitle = doc.second_title;
  var type = doc.tag.name;
  var url = 'meduza.io/' + doc.url;

  console.log(clc.xterm(245)(time) + ' ' + clc.xterm(215)(type.toUpperCase()));
  console.log(clc.xterm(255)(title));
  if (secondTitle) console.log(clc.xterm(250)(secondTitle));
  console.log(clc.xterm(237)(url));
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
  console.log(clc.xterm(240)(time + (source !== 'Meduza' ? ', источник: ' + source : '')));
  console.log('');
  console.log(text.replace('\n\n\n', '\n').replace('\n\n', '\n'));
  console.log('');
  console.log(' ' + context);
  console.log('');
}

if (settings.help) {
  showHelp();
  return;
}

restler
  .get('https://meduza.io/api/v3/search?chrono=' + settings.chrono + '&page=0&per_page=10&locale=' + settings.locale)
  .on('complete', function(data) {
  var collection = data.collection;
  var documents = data.documents;

  if (!settings.show) showLogo();

  for (var i = 0, l = collection.length; i < l; i++) {
    var doc = documents[collection[i]];

    if (!settings.show) {
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
