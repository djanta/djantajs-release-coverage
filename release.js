#!/usr/bin/env node --harmony --expose-gc

'use strict';

let path = require('path');
let _ = require('lodash');
let util = require('util');
let utils = require('./lib/utils');
let cloader = require;

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
    .alias('a', 'facet')
    .describe('a', 'Use this option to define what kind of the project artifact should be released')
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
  .epilogue('for more information, find our manual at https://djantajs.io')
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
  npm: cloader('./lib/facets/npm')
};

/**
 * Releasing given function.
 *
 * @param {string} type the given archetye
 * @param {[]|{}|undefined} list the given repository list
 * @param shared
 * @param cache
 * @return {*}
 * @private
 */
let _release = (type, list, shared = {}, cache = {}) => {
  if (type === 'defaults' || !list) {
    return void undefined; /* Just make the return */
  }

  _.each(_.isArray(list) ? list : list.repositories || [], (r) => {
    r.url = r.url || shared.url;

    r.remoteUrl = argv['remoteUrl'] || undefined;
    r.remote = argv['remote'] || 'origin';

    // Force to update with command line prefix if any ...
    r.url = !_.isNil(argv['urlPrefix']) ? argv['urlPrefix'] : r.url;

    let sep = r.url.endsWith('/') ? '' : '/';
    let suffix = r.name.endsWith('.git') ? '' : '.git';
    let tag = argv['tag'];

    r = _.merge ({ branch: {} }, shared, r, {
      changelog: argv.changelog || (r.changelog || (shared.changelog || true)),
      href: util.format('%s%s%s%s', r.url, sep, r.name, suffix),
      version: !_.isNil(tag) ?
        tag :
        !_.isNil(r.version) ?
          r.version :
          shared.version,
      // Message property ...
      messages: !_.isNil(r.messages) ?
        r.messages :
        !_.isNil(shared.messages) ?
          shared.messages :
          {
            commit: shared.commit || 'Incrementing to version %s',
            tag: shared.tag || 'Releasing version %s'
          }
    });

    let archetype = facets[r.archetype];
    let directory /* Use npm project type as default facet */;

    if (utils.isUrl(r.href) && archetype && (_.isNil(archetype.enabled) ||
      archetype.enabled) && (_.isNil(archetype.which) || archetype.which)) {
      let project = argv['gitProject'];

      if (!_.isNil(project) && utils.isDirectory(project)) {
        // directory = argv['gitProject'];
        // r.project = argv['gitProject'];

        r.project = directory = project;
      }
      else {
        directory = path.join(CWD, '.djanta-bump');
        r.cleanup = true;
      }

      // create the target working directory ...
      if (!utils.isDirectory(directory)) { shell.mkdir('-p', directory); }

      archetype.build(r, directory, (data, err) => {});
    }
  });
};

// Check & trigge the release task if it's exists ...
if (HAS_GIT_INSTALLED && HAS_NPM_INSTALLED) {
  /*
  let yml = YAML.sync(argv.file);
  let common = yml['defaults'];

  (argv['roadmap'] || Object.keys(_.omit(yml, ['defaults'])))
    .forEach((nm) => _release(nm, yml['releases'][nm] || yml[nm], common));
  */

  YAML.sync(argv.file, (err, data) => {
    (argv['roadmap'] || Object.keys(_.omit(data, ['defaults'])))
      .forEach((nm) => _release(nm, data['releases'][nm] || data[nm], {}));
  });
}
else {
  shell.echo ('Sorry, this script requires git');
  shell.exit(1);
}
