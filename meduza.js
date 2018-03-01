#!/usr/bin/env node

// TODO: подписка на вечернюю медузу
// TODO: стриминг
// TODO: поиск
// TODO: категории для английской версии

const argv = require('yargs').argv;
const color = require('cli-color');

let restler, moment, cheerio, html2text, wrap, readline;

const gold = function(s) {
  return Meduza.settings.color ? color.xterm(215)(s) : s;
};
const gray = function(s) {
  return Meduza.settings.color ? color.xterm(245)(s) : s;
};
const dark = function(s) {
  return Meduza.settings.color ? color.xterm(237)(s) : s;
};
const underline = function(s) {
  return Meduza.settings.color ? color.underline(s) : s;
};
const bold = function(s) {
  return Meduza.settings.color ? color.bold.white(s) : s;
};
const italic = function(s) {
  return Meduza.settings.color ? color.italic(s) : s;
};
const center = function(s) {
  let lines = s.split('\n');

  lines = lines.map(function(line) {
    const len = line.length;
    const paddingLength = parseInt((80 - len) / 2) + 1;
    const padding = (new Array(paddingLength)).join(' ');

    return padding + line;
  });

  return lines.join('\n');
};

const urlRegex = new RegExp(new RegExp('(?:(?:https?|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?!(?:10|127)(?:\\.\\d{1,3}){3})(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))(?::\\d{2,5})?(?:/[^ \\f\\n\\r\\t\\v\​\u00a0\\u1680\​\u180e\\u2000-\\u200a\​\u2028\\u2029​\\u202f\\u205f\​\u3000\\]]*)?', 'g'));
const bracketsRegex = new RegExp('\\[\\d+\\]', 'g');

const replaceUrls = function(html, arr) {
  return html.replace(urlRegex, function(link) {
    let isSpaned = false;
    if (link.search('"><span') > -1) isSpaned = true;
    arr.push(link.replace('"><span', ''));
    return arr.length + (isSpaned ? '"><span' : '');
  });
};

const replaceBrackets = function(html) {
  return html.replace(bracketsRegex, function(brackets) {
    return gold(brackets);
  });
};

const Meduza = {
  settings: {},
  chronos: {
    news: { ru: 'Новости' },
    cards: { ru: 'Картотека' },
    articles: { ru: 'Истории' },
    shapito: { ru: 'Шапито' },
    polygon: { ru: 'Полигон' }
  },
  currency: {
    'EUR': '€',
    'RUB': '₽',
    'USD': '$',
    'BTC': 'Ƀ',
    'OIL': '▲',
    '/': '/',
    'up': color.green('↑'),
    'down': color.red('↓')
  },
  spinner: undefined,
  i18n: {
    ['источник']: 'source',
    ['Установленная версия']: 'Installed version',
    ['актуальная версия']: 'last version',
    ['Пожалуйста, обновите программу (npm update -g meduza).']: 'Please, update to the latest version (npm update -g meduza).',
    ['Это тест, хотите его пройти?']: 'Do you want to pass this test?',
    ['Тогда приступим!']: 'Well, then go!',
    ['Как жаль..']: 'How sad..',
    ['Варианты ответа y/n/yes/no (yes=да, no=нет).']: 'The answers is y/n/yes/no.',
    ['Ваш вариант?']: 'Your choice?',
    ['Некорректный ответ']: 'Incorrect answer',
    ['Правильно!']: 'Right!',
    ['Неправильно, правильный ответ']: 'Wrong, right answer',
    ['Ваш результат']: 'Your result',
    ['Просто ноль. :(']: 'Zero. :(',
    ['Совсем плохо.']: 'Very bad.',
    ['Если честно, так себе.']: 'To be honest, so-so.',
    ['Весьма неплохо!']: 'Not bad!',
    ['Отлично!']: 'Good!',
    ['Вы превосходны! :)']: 'You are excellent! :)'
  },

  translate: function(s) {
    return this.settings.locale === 'en' ? this.i18n[s] || `[${s}]` : s;
  },

  parseArgv: function() {
    const settings = {
      help: argv.help || argv.h,
      version: argv.version || argv.v,
      locale: argv.english ? 'en' : 'ru',
      chrono: argv.type || argv.t ? argv.type || argv.t : 'news',
      show: argv.show || argv.s ? argv.show || argv.s : undefined,
      color: !(argv.color === false),
      wrap: 80,
      number: parseInt(argv.number || argv.n),
      exchange: argv.exchange,
      sort: argv.sort
    };

    if (isNaN(settings.number)) {
      settings.number = 10;
    } else if (settings.number < 1) {
      settings.number = 10;
    } else if (settings.number > 30) {
      settings.number = 30;
    }

    const chronos_arr = Object.keys(this.chronos);

    for (let i = 0, l = argv._.length; i < l; i++) {
      if (argv._[i] === 'en') {
        settings.locale = argv._[i];
      } else if (argv._[i].search('meduza.io/') > -1) {
        settings.directUrl = argv._[i];
      } else if (argv._[i].search(':') > -1) {
        settings.show = argv._[i];
      } else if (chronos_arr.indexOf(argv._[i]) > -1) {
        settings.chrono = argv._[i];
      }
    }

    this.settings = settings;
  },

  checkUpdates: function() {
    const _this = this;

    restler
      .get('https://raw.githubusercontent.com/ozio/meduza/master/package.json')
      .on('complete', function(data) {
        const currentVersion = require('./package.json').version;
        const lastVersion = JSON.parse(data).version;

        _this.spinnerHide();

        if (currentVersion !== lastVersion) {
          console.log(_this.showLine('', dark));
          console.log(color.red(center(`${_this.translate('Установленная версия')}: ${currentVersion}, ${_this.translate('актуальная версия')}: ${lastVersion}.`)));
          console.log(color.red(center(_this.translate('Пожалуйста, обновите программу (npm update -g meduza).'))));
          console.log(_this.showLine('', dark));
          console.log('');
        }
      });
  },

  showHelp: function() {
    const help = `
Usage: ${underline(gold('meduza'))} [commands/options]

Commands: ${gray('(you can combine every command with each other)')}

  meduza           \tOutput latest news.
  meduza en        \tOutput latest news from english version.
  meduza <time>    \tOutput article by time (i.e. 15:42).
  meduza <type>    \tChoose articles type (default: news). Only one and only in russian.
  meduza <url>     \tOutput article by URL.

Options:

  -t, --type <type>\tChoose articles type (default: news). Only one and only in russian.
      --english    \tOutput latest news from english version.
  -s, --show <time>\tOutput article by time (i.e. 15:42).
  -n, --number <num>\tNumber of news in output (from 1 to 30).
      --no-color   \tOutput without colors.
      --exchange   \tShow current exchange rate.
  -v, --version    \tDisplay version.
  -h, --help       \tDisplay help information.
      --sort <recency>\tSort news by recency (latest or oldest).

Categories:        \tnews, cards, articles, shapito, polygon.
`;

    console.log(help);
    return true;
  },

  showLogo: function() {
    const logo = `
                          ██▄                                  
                          ██████▄                              
   ▄█░ ▄██░ ▄██░    ▄██       ▀██░  ███░ ███░  ▄██▄     ▄███░  
  ▀███░▀███░▀██░  ███░██░ ██░  ██░  ███░ ███░  ▀████░    ▄███░ 
   ███░ ███░ ██░  ███░█░  ██░  ██░  ███░ ███░    ▄▀    ▄█▀███░ 
   ███░ ███░ ██░  ███░    ██░  ██░  ███░ ███░   ▄▀    ██░ ███░ 
   ███░ ███░ ██░  ███░    ███░ ██░  ███░ ███░  █████░ ██░ ███░ 
   ███░ ███░ ███░ ▀████░   ▀████░   ▀███▀███▀   ▀███░ ███▀████░  ${gray('v' + require('./package.json').version)}
`;

    console.log(gold(logo));
  },

  showVersion: function() {
    console.log(require('./package.json').version);
    return true;
  },

  showDateLine: function(timestamp) {
    let string = `══ ${moment(timestamp, 'X').format('LL')} `;
    const len = this.settings.wrap - string.length;
    string += (new Array(len+1)).join('═');
    console.log(`\n${string}\n`);
  },

  showLine: function(separator, color) {
    const wrapCharsCount = this.settings.wrap + 1;
    let isLengthFloat = false;

    let lineLength = (wrapCharsCount - separator.length) / 2;

    if(lineLength !== parseInt(lineLength)) {
      isLengthFloat = true;
    }
    lineLength = parseInt(lineLength) + 1;

    const line = [
      (new Array(lineLength - (isLengthFloat ? 0 : 1))).join('─'),
      separator,
      (new Array(lineLength)).join('─')
    ];

    return color(line.join(''));
  },

  showArticleShort: function(doc) {
    const time = moment(doc.published_at, 'X').format('H:mm');
    const title = wrap(doc.title);
    const secondTitle = doc.second_title ? wrap(doc.second_title) : null;
    const type = doc.tag ? doc.tag.name : doc.document_type;
    const url = `${doc.document_type === 'promo'
      ? doc.promo_url.replace('http://', '')
      : `https://meduza.io/${doc.url}`
    }`;

    console.log(`${gray(time)} ${gold(type.toUpperCase())}`);
    console.log(title);
    if (secondTitle) console.log(secondTitle);
    console.log(dark(url));
  },

  showQuote: function(source, urls) {
    const quoteWrap = require('wordwrap')(this.settings.wrap - 2);

    const wrappedText = quoteWrap(source.quote);
    const sourceText = quoteWrap(`${source.name.toUpperCase()} [${replaceUrls(source.url, urls)}]`);
    let resText = '';

    const textArr = wrappedText.split('\n');
    const sourceArr = sourceText.split('\n');

    textArr.push(dark((new Array(this.settings.wrap - 1)).join('─')));

    textArr.forEach(function(item) {
      resText += `${gold('┃ ') + item}\n`;
    });

    sourceArr.forEach(function(item, idx) {
      resText += `${gold('┃ ')}${idx > 0 ? '  ' : gold('→ ')}${replaceBrackets(item)}\n`;
    });

    return gray(resText.trim());
  },

  showContext: function(dom, $, urls) {
    let context = '<ul>';
    dom.each(function(idx, el) {
      context += `<li>${replaceUrls($(el).text(), urls)}<br></li>`;
    });
    context += '</ul>';

    return context;
  },

  showCards: function(doc, dom, urls) {
    const article = [];

    for(i = 0; i < doc.chapters_count; i++) {
      article.push(this.showLine(`  ${(i + 1) < 10 ? '0' + (i + 1) : (i + 1)}  `, gold));
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
    let links = '';

    arr.forEach(function(item, idx) {
      links += `[${idx + 1}] – ${underline(item)}\n`;
    });

    return `${this.showLine('', dark)}\n${gray(links.trim())}`;
  },

  showRelated: function(dom, arr) {
    const res = [];

    const head = bold('Читайте также:');
    let html = `<ul>${dom.replace('<ul></ul>', '')}</ul>`;
    html = replaceBrackets(html2text.fromString(
        replaceUrls(
          html, arr
        )
      )
    );

    res.push(head);
    res.push(` ${html}`);

    return res.join('\n\n');
  },

  showAuthors: function(dom) {
    const lines = [];

    lines.push(gold('━━━━━━'));
    const authors = dom.find('.Author');

    authors.each(function(idx, author) {
      const authorName = cheerio(author).find('.Author-name').text();
      const authorInfo = cheerio(author).find('.Author-info').text();

      lines.push(bold(authorName));
      lines.push(italic(authorInfo));
    });

    return lines.join('\n');
  },

  showQuiz: function(dom) {
    const _this = this;

    const quizgroups = dom.find('.QuizGroup');
    const questions = [];
    let currentQuestion = 0;
    let rightAnswers = 0;

    cheerio(quizgroups).each(function(idx, item) {
      const obj = {
        question: cheerio(item).find('.QuizGroup-title').text(),
        figure: null,
        answers: [],
        answer: null
      };

      const figure = cheerio(item).find('.Figure');
      if (figure.length) {
        obj.figure = {};

        const img = cheerio(figure).find('img');
        const caption = cheerio(figure).find('.Figure-caption');
        if (img.length) {
          obj.figure.url = `https://meduza.io${img.attr('src')}`;
          obj.figure.caption = caption.text().trim();
        }
      }

      const answers = cheerio(item).find('.QuizGroup-item');
      answers.each(function(answerIdx, answerItem) {
        const answer = cheerio(answerItem);

        obj.answers.push(answer.text());

        if (answer.find('.QuizGroup-radio--ok').length) {
          obj.answer = `${answerIdx + 1}`;
        }
      });

      questions.push(obj);
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    function askForQuiz() {
      rl.question(`\n${_this.translate('Это тест, хотите его пройти?')} (Y/n) `, function(answer) {
        if (answer === '') answer = 'y';

        const answers = {
          y: true, yes: true, Y: true, YES: true,
          n: false, no: false, N: false, NO: false
        };

        if (answer in answers) {
          if(answers[answer]) {
            // да
            console.log(_this.translate('Тогда приступим!'));
            rl.close();
            return askQuestion();
          } else {
            // нет
            console.log(`${_this.translate('Как жаль..')}\n`);
          }

          rl.close();
        } else {
          // фиг знает что ответил, повторить
          console.log(color.red(_this.translate('Варианты ответа y/n/yes/no (yes=да, no=нет).')));
          return askForQuiz();
        }
      });
    }

    function askQuestion() {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      if (questions[currentQuestion]) {
        const current = questions[currentQuestion];

        // если следующий вопрос есть

        let askString = `(${currentQuestion + 1}/${questions.length}) ${current.question}`;
        askString = '\n' +
          bold(wrap(askString)) +
          gray(current.figure ? '\n' + underline(current.figure.url) + (current.figure.caption ? '\n' + italic(current.figure.caption) : '') : '') +
          '\n';

        current.answers.forEach(function(item, idx) {
          askString += `${idx + 1}) ${item}\n`;
        });

        askString += `${_this.translate('Ваш вариант?')} `;

        rl.question(askString, function(answer) {
          if (parseInt(answer) === answer) {
            answer = parseInt(answer);

            if (answer > current.answers.length || answer < 1 ) {
              // не подходит, повторить
              console.log(color.red(_this.translate('Некорректный ответ')));
              rl.close();
              return askQuestion();

            } else {
              // подходит
              if (current.answer === answer) {
                // угадал
                console.log(color.green(_this.translate('Правильно!')));
                rightAnswers++;
              } else {
                // не угадал
                console.log(color.red(`${_this.translate('Неправильно, правильный ответ')}: `) + underline(current.answer));
              }
              rl.close();

              currentQuestion++;
              return askQuestion();
            }
          } else {
            // не подходит, повторить
            console.log(_this.translate('Некорректный ответ'));
            rl.close();
            return askQuestion();
          }

        });
      } else {
        // если следующего вопроса нет и пора уходить

        rl.close();

        let resString = `\n${_this.translate('Ваш результат')}: ${rightAnswers}/${questions.length}. `;
        const resRate = (rightAnswers / questions.length);

        if (resRate === 0) {
          resString += color.red(_this.translate('Просто ноль. :('));
        } else if (resRate <= .20) {
          resString += color.red(_this.translate('Совсем плохо.'));
        } else if (resRate > .20 && resRate <= .50) {
          resString += color.yellow(_this.translate('Если честно, так себе.'));
        } else if (resRate > .50 && resRate <= .80) {
          resString += color.green(_this.translate('Весьма неплохо!'));
        } else if (resRate > .80 && resRate <= .99) {
          resString += color.green(_this.translate('Отлично!'));
        } else if (resRate === 1) {
          resString += gold(_this.translate('Вы превосходны! :)'));
        }

        console.log(`${resString}\n`);

        process.exit(1);
      }
    }

    return askForQuiz();
  },

  showGallery: function(gallery, urls, compileString) {
    const lines = [];

    gallery.forEach(function(item) {
      const url = `https://meduza.io${item.large_url}`;
      const credit = compileString(item.credit);
      const text = compileString(item.text);

      lines.push(underline(gold(url)));
      if (credit) lines.push(gray(credit));
      if (text) lines.push(text);
      lines.push('');
    });

    return lines.join('\n');
  },

  showArticleFull: function(doc) {
    const type = doc.tag ? doc.tag.name : doc.document_type;
    const title = bold(wrap(doc.title));
    const second_title = doc.second_title ? wrap(doc.second_title) : doc.second_title;
    const time = moment(doc.published_at, 'X').format('LLL');
    const source = doc.source ? doc.source.name : '';
    let url = `https://meduza.io/${doc.url}`;
    const urls = [];

    const $ = cheerio.load(doc.content.body);

    const compileString = (function(html) {
      return replaceBrackets(
        wrap(
          replaceUrls(
            html2text.fromString(html, { wordwrap: null }), urls
          )
        )
      );
    }).bind(this);

    const dom = {
      lead: $('.Lead'),
      body: $('.Body'),
      related: $('.Related ul'),
      cards: $('.CardChapter-body'),
      quiz: $('.Quiz'),
      authors: $('.Authors'),
      context: $('.Context-item')
    };

    dom.body.find('.Related').remove(); // "смотреть также" уже вынесено в отдельный блок
    dom.body.find('.Figure').remove(); // убрал вообще, потому что картинки в консоли не видны, а подписи ломают текст
    dom.body.find('.Embed').remove(); // то же самое и для видео

    const article = [];

    switch (doc.document_type) {
      case 'promo':
        url = doc.promo_url;
        article.push(gray('→ ') + underline(gold(url)));
        break;

      case 'card':
        article.push(this.showCards(doc, dom.cards, urls));
        if(urls.length) article.push(this.showLinks(urls));
        break;

      case 'feature':
        if (dom.quiz.length) {
          if (dom.lead.length) article.push(compileString(dom.lead.html()), this.showLine('  ◆ ◆ ◆  ', dark));
          if (dom.authors.length) article.push(this.showAuthors(dom.authors));
          if (urls.length) article.push(this.showLinks(urls));
        }
        break;

      default:
        if (dom.lead.length) article.push(compileString(dom.lead.html()), this.showLine('  ◆ ◆ ◆  ', dark));
        if (dom.body.length) article.push(compileString(dom.body.html()));
        if (doc.gallery) article.push(this.showGallery(doc.gallery, urls, compileString));
        if (dom.authors.length) article.push(this.showAuthors(dom.authors));
        if (doc.source && doc.source.quote) article.push(this.showQuote(doc.source, urls));
        if (dom.context.length) article.push(' ' + html2text.fromString(this.showContext(dom.context, $, urls), { wordwrap: this.settings.wrap }));
        if (dom.related.length) article.push(this.showRelated(dom.related.html(), urls));

        if (urls.length) article.push(this.showLinks(urls));

        break;
    }

    console.log(gold(type.toUpperCase()));
    console.log(title);
    if (second_title) console.log(second_title);
    console.log(gray(`${time}${!source || source !== 'Meduza' ? `, ${this.translate('источник')}: ${source}` : ''}`));
    console.log('');
    console.log(article.join('\n\n').trim());

    if (dom.quiz.length) {
      console.log(url ? underline(dark(`\n${url}`)) : '');
      this.showQuiz(dom.quiz);
    } else {
      console.log(url ? underline(dark(`\n${url}\n`)) : '');
    }
  },

  spinnerShow: function() {
    if (!this.spinner) {
      const Spinner = require('cli-spinner').Spinner;
      this.spinner = new Spinner('%s');
      this.spinner.setSpinnerString('⣾⣽⣻⢿⡿⣟⣯⣷');
      this.spinner.setSpinnerDelay(50);
    }
    this.spinner.start();
  },

  spinnerHide: function() {
    this.spinner.stop(true);
  },

  getArticleByURL: function(url) {
    const _this = this;

    const pathnameStart = url.search('meduza.io/') + 'meduza.io/'.length;
    const pathname = url.slice(pathnameStart);

    this.spinnerShow();
    restler.get(`https://meduza.io/api/v3/${pathname}`)
      .on('complete', function(data) {
        _this.spinnerHide();
        _this.showArticleFull(data.root);
      });
  },

  getArticles: function() {
    this.spinnerShow();
    const _this = this;

    restler
      .get(`https://meduza.io/api/v3/search?chrono=${this.settings.chrono}&page=0&per_page=${this.settings.number}&locale=${this.settings.locale}`)
      .on('complete', function(data) {
        _this.spinnerHide();

        const documents = data.documents;
        let collection = data.collection;

        if (_this.settings.sort === 'oldest') {
          collection = collection.reverse();
        }

        let momentBefore;
        let momentNow;

        if (!_this.settings.show) _this.showLogo();

        for (let i = 0; i < _this.settings.number; i++) {
          const doc = documents[collection[i]];

          if (!doc) return;

          if (!_this.settings.show) {
            momentNow = moment(doc.published_at, 'X').format('DDD');
            if (typeof momentBefore === 'undefined' || momentBefore !== momentNow) {
              _this.showDateLine(doc.published_at);
            }

            momentBefore = momentNow;
            _this.showArticleShort(doc);
          } else {
            const time = moment(doc.published_at, 'X').format('H:mm');
            if (time === _this.settings.show) {
              _this.spinnerShow();
              restler.get(`https://meduza.io/api/v3/${doc.url}`)
                .on('complete', function(data) {
                  _this.spinnerHide();
                  _this.showArticleFull(data.root);
                });
            }
          }
        }
      })
  },

  showExchangeRate: function() {
    this.spinnerShow();
    const _this = this;

    restler
      .get('https://meduza.io/api/v3/stock/all')
      .on('complete', function(result) {
        _this.spinnerHide();
        let exchange;
        let data;

        try {
          data = JSON.parse(result);

          const strings = [];

          strings.push(`${gold(Meduza.currency.EUR)} ${data.eur.current.toFixed(2)}${Meduza.currency[data.eur.state]}`);
          strings.push(`${gold(Meduza.currency.USD)} ${data.usd.current.toFixed(2)}${Meduza.currency[data.usd.state]}`);
          strings.push(`${gold(Meduza.currency.OIL)} ${data.brent.current.toFixed(2)}${Meduza.currency[data.brent.state]}`);
          strings.push(`${gold(Meduza.currency.BTC)} ${data.btc}₽`);

          exchange = strings.join('  ');

        } catch (e) {
          exchange = 'Sorry, something went wrong';
        } finally {
          console.log(exchange);
        }
      });
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
    readline = require('readline');

    if (this.settings.exchange) return this.showExchangeRate();

    if (this.settings.directUrl) {
      this.getArticleByURL(this.settings.directUrl)
    } else {
      this.getArticles();
    }

    this.checkUpdates();
  }
};

Meduza.init();

module.exports = Meduza;
