#!/usr/bin/env node --harmony --expose-gc

'use strict';

const Path = require('path');
const Fs = require('fs');
const dateformat = require('dateformat');
const _ = require('lodash');
const dateutil = require('dateutil');

const FORMAT = 'yyyy-mm-dd h:MM:ss';

const argv = require('yargs')
  .usage('Usage: $0 --file [file]')
    .alias('f', 'file')
    .demandOption('f')
    .default('f', Path.join(process.cwd(), 'release.yml'))
    .describe('f', 'Define where your yaml roadmap configuration should be read')
    .coerce('file', (file) => {
      if (!Fs.existsSync(file) || !Fs.statSync(file).isFile()) {
        throw new Error ('NoSuchFile exists or is not a readable file: '+ file);
      }
      return file;
    })

    //Define the roadmap options
    .alias('m', 'roadmap')
    .describe('m', 'Use this option to specify the list of the exact roadmap you like to bump')

    //Define the git origin options
    .alias('o', 'origin')
    .describe('o', 'Use this option to define which git origin should be used instead of the default')

    //Define the git origin options
    .alias('u', 'url')
    .array('u')
    .describe('u', 'Use this option to define which git server url prifix which will use to complete the repository full url')

    //Define the version options
    .alias('v', 'version')
    .describe('v', 'Use this option to force the root verion for the given roadmap.' +
      'The given version here will overrive and the dry-run version provided by the roadmap config')

    //Define the roadmap due options
    .alias('w', 'when').array('w').default('w', dateformat(new Date(), FORMAT))
    .describe('w', 'Use this option to force the bump of all the defined roadmap between the date interval')

    //Define the roadmap due options
    .alias('a', 'facet')
    .describe('a', 'Use this option to define what kind of the project artifact should be exclusivly bump')
    .default('a', 'npm')
    .coerce('facet', (facet) => facet)

  .fail((msg, err, yargs) => {
    console.error(msg);
    console.error('You should be doing', yargs.help());
    process.exit(1);
  })
  .help('help')
  .wrap(null)
  .locale('en')
  .epilogue('for more information, find our manual at http://www.djanta.io')
.argv;

const shell = require('shelljs');
const YAML = require('read-yaml');
const semver = require('semver');

const REGEX = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;

shell.config = {
  fatal: false,
  globOptions: {},
  maxdepth: 255,
  noglob: false,
  silent: false,
  verbose: false,
};

//const init = require('init');
//const Changelog = require('generate-changelog');

const CWD = process.cwd();
const DIRNAME = __dirname;

const HAS_GIT_INSTALLED = shell.which('git');
const HAS_NPM_INSTALLED = shell.which('npm');
const GIT_BASH_SCRIPT = Path.resolve(__dirname, './lib/git-tag.sh');

//https://github.com/npm/node-semver
const VERSION_PROFILE = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
];

const facets = {
  npm: {
    enabled: true,
    version: {
      allow: ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease']
    },
    which: shell.which('npm'),
    /*validate: (project, version) => {
      let xlocation = Path.join(project, 'package.json'), v = (version) ? version !== require(xlocation).version : true;
      return Fs.existsSync(project) && FS.statSync(xlocation).isFile() && v;
    },*/
    build: (definition, defaults, directory, cb) => {
      shell.cd(directory); //Jump into the target directory
      shell.exec('git clone '+ definition.href + ' ' + definition.name, (code, stdout, stderr) => {
        console.log('Exit code:', code);
        console.log('Program output:', stdout);
        console.log('Program stderr:', stderr);

        if (0 === code && !stderr) {
          shell.cd(Path.join(directory, definition.name));

          if (cd) cd(stdout, undefined); //Sucessfully callback ...
        } else if (code > 0 && cb) cb(stdout, stderr); //Errored callback ...
      });
    }
  },
  bower: {
    enabled: false,
    version: {
      excludes: ['premajor', 'preminor', 'prepatch', 'prerelease']
    }
  }
};

//let version = shell.exec('node --version', {silent:true}).stdout;
//console.log('%s, cwd: %s, current: %s', version, CWD, DIRNAME);
//"release:major": "changelog -M && git add CHANGELOG.md && git commit -m 'updated CHANGELOG.md' && npm version major && git push origin && git push origin --tags"

let _date = (issue) => {
  return (typeof issue === 'string')? undefined: issue;
};

let _due = (issue, now) => {
  return _date(issue) || (now || Date.now());
};

let bump = (name, definition, defaults = {}, history = {}) => {
  defaults.version = argv.version || defaults.version;
  let now = Date.now(), due = _due(definition.due, now) || _date(argv.when);

  (definition.repositories || []).forEach((repo) => {
    repo.url = repo.url || defaults.url;

    let sep = repo.url.endsWith('/')? '' : '/', suffix = repo.name.endsWith('.git')? '': '.git';

    repo.href = (repo.url + '' + sep + '' + repo.name) + '' + suffix;
    if(REGEX.test(repo.href)) {
      let directory = Path.join(CWD, '.tmp');
      shell.mkdir('-p', directory);
      facets[argv.facet].build(repo, defaults, directory, (data, err) => {
        if (!err) shell.rm('-rf', directory);
      });
    }
  });
};

if (HAS_GIT_INSTALLED && HAS_NPM_INSTALLED) {
  let definition = YAML.sync(argv.file /*Path.resolve(DIRNAME, DEFAULT_ROADMAP)*/);

  console.log('Parse single date: #%s', dateutil.parse('2005-01-01'));

  (argv['roadmap'] || Object.keys(definition)).forEach((name) => {
    if ('defaults' !== name) bump(name, definition[name], definition['defaults']);
  });

  //shell.echo('We\'re all set. Ready to go!');
  //shell.echo('PWD# '+ shell.pwd());
  //shell.echo('LIST# '+ shell.ls());

  //shell.echo('Increment: '+ semver.inc(definition.release.defaults.version, 'prepatch', 'alpha'));
  //shell.cd(__dirname);
  //shell.ls();

  //let rst = shell.exec('npm version 2017.3.1', {silent:true}).stdout;
  //console.log('Result: %s', rst);

  /*return Changelog.generate({patch: true, repoUrl: 'git@github.com:djantaio/djantajs-compiler-rc/generate-changelog'})
    .then(function (changelog) {
      Fs.writeFileSync('./CHANGELOG.md', changelog);
    });*/
}
else {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}
