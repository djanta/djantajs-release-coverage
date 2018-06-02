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
  build: (config, directory, callback) => {

    if (!_.isNil(config.tag) || true === config.tag) {
      if (_.isNil(config.project) || !utils.isDirectory(config.project)) {
        console.log('Working with directory: [%s] -> %s', config.name, directory);

        let clones = ['git', 'clone', '--verbose', config.href, config.name];
        shell.cd (directory); // Jump into the target directory

        let rslt = shell.exec(clones.join(' '), { silent: false });
        if (rslt.code > 0) {
          let err = new Error (rslt.stderr);
          console.error('The following error occured: \n%s', err);
          throw err;
        }
      }
      else {
        console.log('Working with project %s', config.project);
      }

      let project = utils.isDirectory(config.project) ? config.project : path.join(directory, config.name),
        pkg = path.join(project, 'package.json'), originalv = require(pkg).version,
        workingBranch = originalv + '-' + utils.random(36),
        checkout = ['git', 'checkout', '-b', workingBranch, config.remote + '/' + config.branch.draft];

      if (utils.isFile(pkg)) {
        shell.cd(project); // Jump into the cloned directory ...

        // Create a new branch based on the working branch
        shell.exec(checkout.join(' '), { silent: false });

        let bumper = config.version && (_.isNil(semver.valid(config.version))
          || !!~utils.IDS.allow.indexOf(config.version)) ? 'npm version ' + config.version
            : 'npm version patch',

          options = { silent: false }, next = shell.exec(bumper, options).stdout,
          label = semver.clean(next), tag = label,

          bumping = !config.command ? () => void undefined : () => {
            (_.isString(config.command) ? [config.command] : config.command)
              .forEach(command => shell.exec(command, options))
          },

          install = !config.dependencies ? () => {} : () => {
            (_.isString(config.dependencies) ? [config.dependencies] : config.dependencies).forEach(dep => {
              if (typeof dep === 'string') {
                shell.exec('npm i --save ' + dep, options);
              }
              else if (dep.name) {
                let normalized = 'npm i ' + (dep.scope ? '--' + dep.scope : '--save') + ' ' +
                  (dep.version ? dep.name + (utils.isUrl(dep.name) ? '#' : '@') + dep.version : dep.name);
                shell.exec(normalized, options);
              }
            })
          };

        let flows = {
          rename: ['git', 'branch', '-m', tag], // Rename the 'release' branch to into the version name
          bump: bumping,
          dependency: install,

          add: ['git', 'add', '--verbose', '.'],
          commit: ['git', 'commit', '-a', '-m', '"' + util.format (config.messages.commit, label) + '"'],

          // Merge the tag branch into the draft and push the origin/draft branch
          checkoutDevelopBranch: ['git', 'checkout', config.branch.draft],
          mergeTagBranchIntoDevelop: ['git', 'merge', '--no-ff', '--no-edit', '--log', '--progress', tag],
          pushMergedDevelopBranch: ['git', 'push', config.remote, config.branch.draft]
        };

        // Fixing to avoid self branch merge.
        if (config.branch.draft !== config.branch.master) {
          flows.checkoutMasterBranch = ['git', 'checkout', config.branch.master];
          flows.mergeDevelopIntoMaster = ['git', 'merge', '--no-ff', '--no-edit', '--log', '--progress', config.branch.draft];
          flows.pushMergedMasterBranch = ['git', 'push', config.remote, config.branch.master];
        }

        // Tag the current branch whether develop or master branch ...
        flows.release = ['git', 'tag', '-m', '"' + util.format(config.messages.tag, tag) + '"', '-a', tag];
        //flows.pushTag = ['git', 'push', config.remote, next.trim()];
        flows.pushTag = ['git', 'push', config.remote]; // Push onto the given remote ...
        flows.pushAll = ['git', 'push', '--tags', config.remote]; // Push all tags ...

        // Force delete the tagged branch. Please this insertion must the last statement. Do not remove it
        flows.localTagRemove = ['git', 'branch', '-D', tag];

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
              shell.exec (flows[name].join(' '), options);
            }
          });
        }
        catch (err) {
          console.error(err);
        }
        finally {
          if (config.cleanup) {
            shell.rm ('-rf', project);
          }
        }
      }
    }
  }
};
