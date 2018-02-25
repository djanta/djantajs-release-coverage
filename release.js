#!/usr/bin/env node --harmony --expose-gc

'use strict';

const Path = require('path');
const Fs = require('fs');
const dateformat = require('dateformat');
const _ = require('lodash');
const dateutil = require('dateutil');
const FORMAT = 'yyyy-mm-dd h:MM:ss';
const util = require('util');
const utils = require('./lib/utils');

const argv = require('yargs')
  .usage('Usage: $0 --file [file]')
    .alias('f', 'file')
    .demandOption('f')
    .default('f', Path.join(process.cwd(), 'release.yml'))
    .describe('f', 'Define where to load the roadmap from')
    .coerce('file', f => {
      if(!utils.isFile(f)) { throw new Error (util.format('NosuchFile exists or is not a readable file: %s ', f)); }
      return f;
    })

    //Define the git origin options
    .alias('u', 'url-prefix')//.array('u')
    .describe('u', 'Specify the Git repository host prefix')

    //Define the roadmap tag version
    .alias('t', 'semver-tag')//.default('t', 'patch')
    .describe('t', 'Define the default semver strategy to use')

    //Define the roadmap origin current branch
    .alias('M', 'master-branch')
    .describe('M', 'Specify the default working repositiory defaut master branch name')
    //.default('M', 'master')

    //Define the roadmap origin current branch
    .alias('D', 'draft-branch')
    .describe('D', 'Specify the branch that has to be used as the default working branch')
    //.default('D', 'develop')

    //Define the roadmap due options
    .alias('a', 'archetype')
    .describe('a', 'Use this option to define what kind of the project artifact should be exclusivly bump')
    .default('a', 'npm')
    .coerce('facet', (facet) => facet)

    //Define the changelog
    .alias('c', 'changelog')
    .describe('c', 'Use this option to define whether or not the change log file should be generated')
    .default('c', undefined)
    .coerce('changelog', (changelog) => /(yes|Yes|y|Y)$/.test(changelog))

    //Specify the branch roadmap which correspond to the traget branch
    .alias('e', 'roadmap').array('e')//.demandOption('e')
    .describe('e', 'Specify the roadmap list to execute')

    .alias('p', 'git-project')
    .describe('p', 'Specify the local Git project directory')
    .coerce('git-project', project => {
      if(!utils.isDirectory(project)) {
        throw new Error (util.format('NosuchDirectory exists or is not a readable directory: %s', project));
      }
      return project;
    })

  .fail((msg, err, yargs) => {
    console.error(msg);
    console.error('You should be doing', yargs.help());
    process.exit(1);
  })
  .help('help')
  .wrap(null)
  .locale('en')
  .epilogue('for more information, find our manual at https://www.djanta.io')
.argv;

const shell = require('shelljs');
const YAML = require('read-yaml');
const semver = require('semver');
const changelog = require('changelog');

const bin = Path.resolve(__dirname, 'node_modules', '.bin', 'changelog');

shell.config = {
  fatal: false,
  globOptions: {},
  maxdepth: 255,
  noglob: false,
  silent: false,
  verbose: true,
};

//const init = require('init');

const CWD = process.cwd();
const HAS_GIT_INSTALLED = shell.which('git');
const HAS_NPM_INSTALLED = shell.which('npm');

//https://github.com/npm/node-semver
/*const VERSION_PROFILE = [
  'major',
  'premajor',
  'minor',
  'preminor',
  'patch',
  'prepatch',
  'prerelease'
];*/

const facets = {
  npm: require('./lib/archetypes/npm')
};

let _bump = (name, descriptor, defaults = {}, cache = {}) => {
  if(name === 'defaults' || !descriptor) { return; /* Just make the return */ }

  //defaults.version = argv.version || defaults.version;
  (descriptor.repositories || []).forEach(working => {
    working.url = working.url || defaults.url;

    //Force to update with command line prefix if any ...
    working.url = !_.isNil(argv['urlPrefix']) ? argv['urlPrefix'] : working.url;

    let sep = working.url.endsWith('/') ? '' : '/', suffix = working.name.endsWith('.git') ? '' : '.git',
      tag = argv['semverTag'];

    working = _.merge ({ branch: {} }, defaults, working, {
      changelog: argv.changelog || (working.changelog || (defaults.changelog || true)),
      href: (working.url + '' + sep + '' + working.name) + '' + suffix,
      version: !_.isNil(tag) ? tag : (!_.isNil(working.version) ? working.version : defaults.version),
    });

    let archetype = facets[working.archetype], directory /* Use npm project type as defaukt facet */;
    if(utils.isUrl(working.href) && archetype && (typeof archetype.enabled === 'undefined' || archetype.enabled)
      && (typeof archetype.which === 'undefined' || archetype.which)) {

      if(!_.isNil(argv['gitProject']) && utils.isDirectory(argv['gitProject'])) {
        directory = argv['gitProject'];
        working.project = argv['gitProject'];
      }
      else {
        directory = Path.join(CWD, '.djanta-bump'); working.cleanup = true;
      }

      if(!utils.isDirectory(directory)) { shell.mkdir('-p', directory); }

      archetype.build (working, directory, (data, err) => {});
    }
  });
};

if (HAS_GIT_INSTALLED && HAS_NPM_INSTALLED) {
  let config = YAML.sync(argv.file /*Path.resolve(DIRNAME, DEFAULT_ROADMAP)*/ ), defaults = config['defaults'];
  (argv['roadmap'] || Object.keys (_.omit(config, ['defaults']))).forEach(name => _bump (name, config[name], defaults));
}
else {
  shell.echo ('Sorry, this script requires git');
  shell.exit(1);
}
