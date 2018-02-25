'use strict';

const shell = require('shelljs');
const semver = require('semver');

const Path = require('path');
const Fs = require('fs');
const utils = require('../utils');
const _ = require('lodash');

const version_ids = {
  allow: ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease', 'from-git']
};

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const random = (len) => {
  let buf = [], chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', charlen = chars.length;
  for(let i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

module.exports = {
  enabled: true,
  version: version_ids,
  which: shell.which('npm'),
  build: (config, directory, callback) => {

    if(_.isUndefined(config.tag) || true === config.tag) {
      if(_.isNil(config.project) || !utils.isDirectory(config.project)) {
        console.log('Working with directory: [%s] -> %s', config.name, directory);
        let clones = ['git clone --verbose', config.href, config.name];
        shell.cd (directory); //Jump into the target directory

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

      let project = utils.isDirectory(config.project) ? config.project : Path.join(directory, config.name),
        _package = Path.join(project, 'package.json'), originalv = require(_package).version,
        _tmpBranchName = originalv + '-' + random(36);

      if (utils.isFile(_package)) {
        shell.cd(project); //Jump into the cloned directory ...

        //shell.exec('git checkout ' + config.branch.draft, { silent: false }); //Switching to the working branch

        //Create a new branch based on the working branch
        shell.exec('git checkout -b '+ _tmpBranchName +' origin/' + config.branch.draft, {silent: false});

        let script = (config.version && (null === semver.valid(config.version)
          || !!~version_ids.allow.indexOf(config.version))) ? ('npm version ' + config.version) : 'npm version patch';

        let options = {silent: false}, version = shell.exec(script, options).stdout,
          label = /*'release-' +*/ semver.clean(version), tag = semver.clean(version);

        let _executeBumpCommand = !config.command ? () => void undefined : () => {
          (typeof config.command === 'string' ? [config.command] : config.command).forEach(cmd => shell.exec(cmd, options))
        };

        let _installDependency = !config.dependencies ? () => {} : () => {
          ((typeof config.dependencies === 'string') ? [config.dependencies] : config.dependencies).forEach(dep => {
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

        let _releaselogGenerate = () => {
          if (config.changelog || /(yes|Yes|y|Y)$/.test(config.changelog)) {
            shell.exec('npm i -g git-release-notes', {silent: true});
            shell.exec('git-release-notes -p ' + project + ' -b ' + tag +
              ' -m type -m issue -m title -m scope HEAD^@ markdown > changelog.md', options);
          }
        };

        let flows = {
          rename: ['git branch -m', tag], //Rename the 'release' branch to into the version name
          executeBump: _executeBumpCommand,
          dependency: _installDependency,
          changelog: _releaselogGenerate, //Generate the changelog.md. Ready for the next release.

          add: ['git add', '--verbose', '.'],
          commitChangedVersion: ['git commit', '-a', '-m', '"Incrementing version: ', label + '"'],

          //Merge the tag branch into the draft and push the origin/draft branch
          checkoutMaster: ['git checkout', config.branch.draft],
          checkoutMasterMerge: ['git merge', '--no-ff', '--no-edit', '--log', '--progress', tag],
          pushMasterMerged: ['git push origin', config.branch.draft]
        };

        // Fixing to avoid self branch merge.
        if (config.branch.draft !== config.branch.master) {
          // Merge the develop branch with the master
          flows.checkoutDraft = ['git checkout', config.branch.master];
          flows.mergeDraftIntoMaster = ['git merge', '--no-ff', '--no-edit', '--log', '--progress', config.branch.draft];
          flows.pushMergedMaster = ['git push origin', config.branch.master];
        }

        flows.releasingTagMaster = ['git tag', '-m', '"Releasing tagged version', tag + '"', '-a', tag];
        flows.pushMasterTag = ['git push origin', version.trim()];

        //Force delete the tagged branch. Please this insertion must the last statement. Do not remove it
        flows.removeWorkingTaggedBranch = ['git branch -D', tag];

        try {
          Object.keys(flows).forEach(name => {
            if (typeof flows[name] === 'function') {
              try {
                flows[name]();
              }
              catch (err) {
                throw err;
              }
            }
            else {
              shell.exec(flows[name].join(' '), options);
            }
          });
        }
        catch (ex) {
          console.error(ex);
        }
        finally {
          if (config.cleanup) {
            shell.rm('-rf', project);
          }
        }
      }
    }
  }
};
