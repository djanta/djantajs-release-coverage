'use strict';

let shell = require('shelljs');
let semver = require('semver');

let util = require('util');
let path = require('path');
let utils = require('../utils');
let _ = require('lodash');

module.exports = {
  version: utils.IDS,
  enabled: true,
  which: shell.which('npm'),
  build: (repo, directory, callback) => {

    if (!_.isNil(repo.tag) || true === repo.tag) {
      if (_.isNil(repo.project) || !utils.isDirectory(repo.project)) {
        console.log('Working with directory: [%s] -> %s', repo.name, directory);

        let criteria = { silent: false };
        let clones = ['git', 'clone', '--verbose', repo.href, repo.name];
        shell.cd(directory); // Jump into the target directory

        let rslt = shell.exec(clones.join(' '), criteria);
        if (rslt.code > 0) {
          let err = new Error (rslt.stderr);
          console.error('The following error occured: \n%s', err);
          throw err;
        }
      }
      else {
        console.log('Working with project %s', repo.project);
      }

      let project = utils.isDirectory(repo.project) ?
        repo.project :
        path.join(directory, repo.name);

      let pkg = path.join(project, 'package.json');
      let originalv = require(pkg).version;

      /* workingBranch = originalv + '-' + utils.random(36), */

      // checkout = ['git', 'checkout', config.branch.draft];
      // checkout = ['git', 'checkout', '-b', workingBranch, config.remote +
      //  '/' + config.branch.draft];

      if (!_.isNil(pkg) && utils.isFile(pkg)) {

        shell.cd(project); // Jump into the cloned directory ...

        // Create a new branch based on the working branch
        // shell.exec(checkout.join(' '), { silent: false });

        let bumper = repo.version && (_.isNil(semver.valid(repo.version)) ||
          !!~utils.IDS.allow.indexOf(repo.version)) ?
            util.format('npm version %s', repo.version) :
            'npm version patch';

          let released = shell.exec(bumper, criteria).stdout;
          let label = semver.clean(released);
          let tag = label;
          let implies = repo.dependencies;

          let bumping = !repo.command ? () => void undefined : () => {
            (_.isString(repo.command) ? [repo.command] : repo.command)
              .forEach(command => shell.exec(command, criteria))
          };

          let install = _.isNil(implies) ? () => {} : () => {
            (_.isString(implies) ? [implies] : implies).forEach(dep => {
              if (_.isString(dep)) {
                shell.exec('npm i --save ' + dep, criteria);
              }
              else if (dep.name) {
                let normalized = 'npm i ' + (dep.scope ? '--' + dep.scope : '--save') + ' ' +
                  (dep.version ? dep.name + (utils.isUrl(dep.name) ? '#' : '@') + dep.version : dep.name);
                shell.exec(normalized, criteria);
              }
            })
          };

        let flows = {
          checkout: ['git', 'checkout', repo.branch.draft],
          bump: bumping,
          dependency: install,
          add: ['git', 'add', '--verbose', '.'],
          commit: ['git', 'commit', '-a', '-m', '"' + util.format(repo.messages.commit, label) + '"'],
          pushDraftBranch: ['git', 'push', '-u', repo.remote, repo.branch.draft]
        };

        // Fixing to avoid self branch merge.
        if (repo.branch.draft !== repo.branch.master) {
          flows.checkoutMasterBranch = ['git', 'checkout', repo.branch.master];
          flows.mergeDevelopIntoMaster = ['git', 'merge', '--no-ff', '--no-edit', '--log',
            '--progress',
            repo.branch.draft
          ];
          flows.pushMergedMasterBranch = ['git', 'push', repo.remote, repo.branch.master];
        }

        flows.verifyTag = () => {
          // shell.exec('git tag -l '+ released, options).stdout
          let rev = shell.exec('git rev-parse -q --verify "refs/tags/' + released + '"', criteria).stdout;
          if (_.isNil(rev) || _.isNil(rev.trim())) {
            // Tag the current branch whether develop or master branch ...
            shell.exec(['git', 'tag', '-m', '"' + util.format(repo.messages.tag, tag) + '"', '-a'
              , released].join(' '), criteria)
          }
          else {
            console.log('Npm version have already tag the version')
          }
        };

        flows.pushTag = ['git', 'push', repo.remote]; // Push onto the given remote ...
        flows.pushAll = ['git', 'push', '--tags', repo.remote]; // Push all tags ...

        try {
          Object.keys(flows).forEach(name => {
            if (_.isFunction(flows[name])) {
              try {
                flows[name]();
              }
              catch (err) {
                throw err;
              }
            }
            else {
              shell.exec (flows[name].join(' '), criteria);
            }
          });
        }
        catch (err) {
          console.error(err);
        }
        finally {
          if (repo.cleanup) {
            shell.rm ('-rf', project);
          }
        }
      }
    }
  }
};
