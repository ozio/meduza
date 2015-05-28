#!/usr/bin/env node

var restler   = require('restler');
var moment    = require('moment');
var clc       = require('cli-color');
var argv      = require('yargs').argv;
var html2text = require('html-to-text');
var jsdom     = require('jsdom');
moment.locale('ru');

for(var i = 0, l = argv._.length; i < l; i++) {
  if(argv._[i] === 'en') {
    argv.locale = argv._[i];
  } else if(argv._[i].search(':')) {
    argv.show = argv._[i];
  }
  // Запилить поддержку указания только минуты, без часа.
  /*else if(parseInt(argv[i]) == argv[i]) {
    argv.minutes = argv[i];
  }*/
}

var settings = {
  locale: argv.locale || argv.l ? argv.locale || argv.l : 'ru',
  limit: argv.limit ? argv.limit : '10',
  chrono: argv.chrono || argv.c ? argv.chrono || argv.c : 'news',
  //style: argv.style ? argv.style : 'classic',
  show: argv.show || argv.s ? argv.show || argv.s : false,
  help: !!(argv.help || argv.h)
};

function showHelp() {
  var m = function(s) {
    return clc.xterm(215)(s)
  };

  console.log(
    '\n' +
    'Usage: ' + m('meduza') + ' [options]\n' +
    '\n' +
    'Options:\n' +
    '-l, --locale, en \tShow Meduza in other locale. Default: ' + m('ru') + ', can be ' + m('en') + '.\n' +
    '-c, --chrono     \tSet content type. Default: ' + m('news') + ', can be ' + m('feature') + ', ' + m('cards') + ',\n' +
    '                 \t' + m('galleries') + ', ' + m('promo') + ', ' + m('shapito') + ' and ' + m('quiz') + '.\n' +
    '-s, --show <H:mm>\tView full document by time in 24-format (show all if \n' +
    '                 \tthere are several), i.e. ' + m('17:21') + '.\n' +
    '-h, --help       \tShow this message.\n'
//    '-v, --version    \tShow version.\n'
  )
}

function showLogo() {
  var logo =
        "                         @@#`                                \n" +
        "                         @@@@@@;                             \n" +
        " '@@# @@@# @@@:    ;@@.     .#@@+ ;@@  @@@   :@@+    `#@@@'  \n" +
        ":;@@@';@@@;;@@+  @@@'@@; @@@  @@+ ;@@` @@@  `+@@@@     :@@@  \n" +
        "  @@@  @@@  @@+  @@@'@;  @@@  @@+ ;@@` @@@     ,#    ,@#@@@  \n" +
        "  @@@  @@@  @@+  @@@     @@@  @@+ ;@@` @@@    #,   :@@,`@@@  \n" +
        "  @@@  @@@  @@+, @@@     @@@@+@@+ ;@@,,@@@.: @@@@@::@@;,@@@.:\n" +
        "  @@@  @@@ `@@@. #@@@@+   `@@@@   ;@@@ @@@@   #@@@ ,@@@`@@@@ \n";

  console.log(clc.xterm(215)(logo));
}

function showShort(doc) {
  var time         = moment(doc.published_at, 'X').format('H:mm');
  var title        = doc.title;
  var second_title = doc.second_title;
  var type         = doc.tag.name;
  var url          = 'meduza.io/' + doc.url;

  console.log(clc.xterm(245)(time) + ' ' + clc.xterm(215)(type.toUpperCase()));
  console.log(clc.xterm(255)(title));
  if (second_title) console.log(clc.xterm(250)(second_title));
  console.log(clc.xterm(237)(url));
}

function showFull(doc) {
  var type   = doc.tag.name;
  var title  = doc.title;
  var time   = moment(doc.published_at, 'X').format('LLL');
  var source = doc.source.name;

  jsdom.env(doc.content.body, function(err, window){
    var text = html2text.fromString(window.document.querySelector('.Body').innerHTML, {
      wordwrap: 80
    });

    var context_els = window.document.querySelectorAll('.Context-item');
    var context = "<ul>";
    for(var i = 0, l = context_els.length; i < l; i++) {
      context += "<li>" + context_els[i].textContent + "</li>"
    }
    context += "</ul>";

    var context = html2text.fromString(context);

    console.log(clc.xterm(215)(type.toUpperCase()));
    console.log(clc.xterm(255)(title));
    console.log(clc.xterm(240)(time + (source !== 'Meduza' ? ', источник: ' + source : '')));
    console.log('');
    console.log(text.replace('\n\n\n', '\n').replace('\n\n', '\n'));
    console.log('');
    console.log(' ' + context);
    console.log('');

    window.close()
  });

}

if(settings.help) {
  showHelp();
  return;
}

restler
  .get('https://meduza.io/api/v3/search?chrono=' + settings.chrono + '&page=0&per_page=' + settings.limit + '&locale=' + settings.locale)
  .on('complete', function(data) {
    var collection = data.collection;
    var documents  = data.documents;

    var has_to_show = false;

    if (!settings.show) showLogo();

    for (var i = 0, l = collection.length; i < l; i++) {
      var doc = documents[collection[i]];

      if (!settings.show) {
        showShort(doc);
      } else {
        var time = moment(doc.published_at, 'X').format('H:mm');
        if (time === settings.show) {
          has_to_show = true;

          restler.get('https://meduza.io/api/v3/' + doc.url).on('complete', function(data) {
            showFull(data.root);
          });
        }
      }
    }
  });
