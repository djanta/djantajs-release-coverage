#!/usr/bin/env node --harmony --expose-gc

'use strict';

let path = require('path');
// let Fs = require('fs');
let dateformat = require('dateformat');
let _ = require('lodash');
let dateutil = require('dateutil');
// let FORMAT = 'yyyy-mm-dd h:MM:ss';
let util = require('util');
let utils = require('./lib/utils');

let argv = require('yargs')
  .usage('Usage: $0 --file [file]')
    .alias('f', 'file')
    .demandOption('f')
    .default('f', path.join(process.cwd(), 'release.yml'))
    .describe('f', 'Define where to load the roadmap from')
    .coerce('file', f => {
      if (!utils.isFile(f)) {
        throw new Error (util.format('NosuchFile exists or is not a readable file: %s ', f));
      }
      return f;
    })

    // Define the git origin options
    .alias('u', 'url-prefix')//.array('u')
    .describe('u', 'Specify the Git repository host prefix')

    //Define the roadmap tag version
    .alias('t', 'tag')//.default('t', 'patch')
    .describe('t', 'Define the default semver strategy to use')

    //Define the roadmap origin current branch
    .alias('M', 'master-branch')
    .describe('M', 'Specify the default working repositiory defaut master branch name')
    //.default('M', 'master')

    //Define the roadmap origin current branch
    .alias('D', 'draft-branch')
    .describe('D', 'Specify the branch that has to be used as the default working branch')
    //.default('D', 'develop')

    // Define the target git remote to work with. 'origin' will be used as default instead
    .alias('R', 'remote')
    .describe('R', 'Define the target git remote name to work with')
    .default('R', 'origin')

    // Define the target git remote url to point to.
    .alias('U', 'remote-url')
    .describe('U', 'Define the target git remote url to point to')

    //Define the roadmap due options
    .alias('a', 'archetype')
    .describe('a', 'Use this option to define what kind of the project artifact should be exclusivly bump')
    .default('a', 'npm')
    .coerce('facet', (facet) => facet)

    //Define the changelog
    // .alias('c', 'changelog')
    // .describe('c', 'Use this option to define whether or not the change log file should be generated')
    // .default('c', undefined)
    // .coerce('changelog', (changelog) => /(yes|Yes|y|Y)$/.test(changelog))

    //Specify the branch roadmap which correspond to the traget branch
    .alias('e', 'roadmap').array('e')//.demandOption('e')
    .describe('e', 'Specify the roadmap list to execute')

    .alias('p', 'git-project')
    .describe('p', 'Specify the local Git project directory')
    .coerce('git-project', project => {
      if (!utils.isDirectory(project)) {
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

let shell = require('shelljs');
let YAML = require('read-yaml');
let semver = require('semver');
let changelog = require('changelog');

let bin = path.resolve(__dirname, 'node_modules', '.bin', 'changelog');

shell.config = {
  fatal: false,
  globOptions: {},
  maxdepth: 255,
  noglob: false,
  silent: false,
  verbose: true,
};

let CWD = process.cwd();
let HAS_GIT_INSTALLED = shell.which('git');
let HAS_NPM_INSTALLED = shell.which('npm');

let facets = {
  npm: require('./lib/archetypes/npm')
};

let _bump = (name, descriptor, defaults = {}, cache = {}) => {
  if (name === 'defaults' || !descriptor) { return void undefined; /* Just make the return */ }

  (descriptor.repositories || []).forEach(repository => {
    repository.url = repository.url || defaults.url;

    repository.remoteUrl = argv['remoteUrl'] || undefined;
    repository.remote = argv['remote'] || 'origin';

    // Force to update with command line prefix if any ...
    repository.url = !_.isNil(argv['urlPrefix']) ? argv['urlPrefix'] : repository.url;

    let sep = repository.url.endsWith('/') ? '' : '/', suffix = repository.name.endsWith('.git') ? '' : '.git',
      tag = argv['tag'];

    repository = _.merge ({ branch: {} }, defaults, repository, {
      changelog: argv.changelog || (repository.changelog || (defaults.changelog || true)),
      href: (repository.url + '' + sep + '' + repository.name) + '' + suffix,
      version: !_.isNil(tag) ? tag : (!_.isNil(repository.version) ? repository.version : defaults.version),
      messages: !_.isNil(repository.messages) ? repository.messages : (!_.isNil(defaults.messages) ? defaults.messages
        : {
          commit: defaults.commit || 'Incrementing to version %s',
          tag: defaults.tag || 'Releasing version %s'
        })
    });

    let archetype = facets[repository.archetype], directory /* Use npm project type as defaukt facet */;
    if (utils.isUrl(repository.href) && archetype && (typeof archetype.enabled === 'undefined' || archetype.enabled)
      && (typeof archetype.which === 'undefined' || archetype.which)) {

      if (!_.isNil(argv['gitProject']) && utils.isDirectory(argv['gitProject'])) {
        directory = argv['gitProject'];
        repository.project = argv['gitProject'];
      }
      else {
        directory = path.join(CWD, '.djanta-bump'); repository.cleanup = true;
      }

      if (!utils.isDirectory(directory)) {
        shell.mkdir('-p', directory);
      }
      archetype.build (repository, directory, (data, err) => {});
    }
  });
};

if (HAS_GIT_INSTALLED && HAS_NPM_INSTALLED) {
  let config = YAML.sync(argv.file /*path.resolve(DIRNAME, DEFAULT_ROADMAP)*/ ), defaults = config['defaults'];
  (argv['roadmap'] || Object.keys (_.omit(config, ['defaults']))).forEach(name => _bump (name, config[name], defaults));
}
else {
  shell.echo ('Sorry, this script requires git');
  shell.exit(1);
}
