#!/usr/bin/env node --harmony --expose-gc

'use strict';

const Path = require('path');
const Fs = require('fs');
const dateformat = require('dateformat');
const _ = require('lodash');
const dateutil = require('dateutil');
const FORMAT = 'yyyy-mm-dd h:MM:ss';
const util = require('util');

let conventionalChangelog = require('conventional-changelog');

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

    //Define the git origin options
    .alias('u', 'url').array('u')
    .describe('u', 'Use this option to define which git server url prifix which will use to complete the repository full url')

    //Define the roadmap tag version
    .alias('t', 'tag').default('t', 'patch')
    .describe('t', 'Specify the manual version to tag')

    //Define the roadmap origin current branch
    .alias('M', 'master-branch')
    .describe('M', 'Specify your git repositiory defaut master branch name')
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
    .alias('e', 'roadmap').demandOption('e').array('e')
    .describe('e', 'Specify that source Git branch where the event come from')

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
//const verb = require('verb');
const changelog = require('changelog');

const REGEX = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
const bin = Path.resolve(__dirname, 'node_modules', '.bin', 'changelog');

//console.log('Chamgelg bin: %s', bin);

shell.config = {
  fatal: false,
  globOptions: {},
  maxdepth: 255,
  noglob: false,
  silent: false,
  verbose: true,
};

//const init = require('init');
//const Changelog = require('generate-changelog');

const CWD = process.cwd();
//const DIRNAME = __dirname;

const HAS_GIT_INSTALLED = shell.which('git');
const HAS_NPM_INSTALLED = shell.which('npm');
const GIT_BASH_SCRIPT = Path.resolve(__dirname, './lib/git-tag.sh');

const isDirectory = (source) => source && Fs.existsSync(source) && Fs.statSync(source).isDirectory();
const isFile = (source) => source && Fs.existsSync(source) && Fs.statSync(source).isFile();

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
  npm: {
    enabled: true,
    version: {
      allow: ['major', 'premajor', 'minor', 'preminor', 'patch', 'prepatch', 'prerelease', 'from-git']
    },
    which: shell.which('npm'),
    build: (repository, directory, callback) => {
      console.log('Working with directory: [%s] -> %s', repository.name, directory);

      let cloneCmd = ['git clone --verbose', repository.href, repository.name];
      shell.cd (directory); //Jump into the target directory

      let rslt = shell.exec(cloneCmd.join(' '), { silent: false });
      if(rslt.code > 0) {
        console.error('The following error occured: \n%s', rslt.stderr);
        throw new Error(rslt.stderr);
      }
      else {
        let project = Path.join(directory, repository.name), _package = Path.join(project, 'package.json');

        if (isFile (_package)) {
          shell.cd (project); //Jump into the cloned directory ...

          shell.exec('git checkout ' + repository.branch.draft, { silent: false });
          shell.exec('git checkout -b release ', { silent: false });

          let options = { silent: false }, version = (repository.version && (null !== semver.valid(repository.version)
              || !!~facets.npm.version.allow.indexOf(repository.version))) ?
            shell.exec('npm version ' + repository.version, options).stdout : shell.exec('npm version patch', options).stdout,
            label = 'release-' + semver.clean(version), tag = semver.clean(version);

          let _installNpm = !repository.command ? () => {}: () => {
            (typeof repository.command === 'string' ? [repository.command] : repository.command).forEach(x => {
              let xresult = shell.exec(x, options); console.log(xresult.stdout);
            })
          };

          console.log('Dependencies -> %s', JSON.stringify(repository.dependencies, null, 2));

          let _dependency = !repository.dependencies ? () => {} : () => {
            ((typeof repository.dependencies === 'string') ? [repository.dependencies] : repository.dependencies)
              .forEach(dependency => {
                let xcmd;
                if(typeof dependency === 'string') {
                  xcmd = shell.exec('npm i -S ' + dependency, options);
                }
                else if(dependency.name) {
                  let normalized = 'npm i ' + (dependency.scope ? '--' + dependency.scope : '-S') + ' ' +
                    (dependency.version ? dependency.name + '@' + dependency.version : dependency.name);

                  xcmd = shell.exec(normalized, options);
                }

                if(xcmd) { console.log(xcmd.stderr); }
            })
          };

          //let standardChangelog = require('standard-changelog');

          let _changelog = () => {
            //standardChangelog()
            //  .pipe(process.stdout); // or any writable stream

            conventionalChangelog({
              preset: 'angular'
            })
              .pipe(() => console.log(require('util').inspect(arguments))); // or any writable stream
          };

          let flows = {
            install: _installNpm,
            dependency: _dependency,
            rename: ['git branch -m', tag],
            status: ['git status'],
            add: ['git add', '--verbose', '-u', '.'],
            reset: ['git reset', '--', 'node_modules'],
            commit: ['git commit', '-a', '-m', '"Incrementing version number to', label + '"'],

            changelog: _changelog,

            //Merge the tag branch into the master and push the master branch
            master: ['git checkout', repository.branch.master],
            masterMerge: ['git merge --no-ff', tag],
            //masterPush: ['git push origin', repository.branch.master],

            //Tag and push the version ...
            releasing: ['git tag', '-a', '-m', '"Releasing tagged version', tag + '"', tag],
            //pushTag: ['git push origin', version.trim()],
          };

          // Fixing to avoid self branch merge.
          if(repository.branch.draft !== repository.branch.master) {
            // Merge the develop branch with the master
            flows.draft = ['git checkout', repository.branch.draft];
            flows.draftMerge = ['git merge --no-ff', repository.branch.master];
            //flows.draftPush = ['git push origin', repository.branch.draft];
          }

          //Force delete the tagged branch. Please this insertion must the last statement. Do not remove it
          flows.remove = ['git branch -D', tag];

          try {
            Object.keys(flows).forEach(name => {
              if (typeof flows[name] === 'function') {
                try { flows[name](); }
                catch (e){ console.error(e); }
              }
              else {
                let flow = flows[name].join(' ');
                //console.log('Running [%s] -> [%s]', name, flow);
                //shell.exec(flow, options);
              }
            });
          }
          catch (ex) { console.error(ex); }
          finally {
            shell.rm('-rf', project);
          }
        }
      }
    }
  }
};

let _bump = (name, descriptor, defaults = {}, cache = {}) => {
  if (name === 'defaults' || !descriptor) {return; /*Just make the return*/}

  //defaults.version = argv.version || defaults.version;
  (descriptor.repositories || []).forEach((repository) => {
    repository.url = repository.url || defaults.url;

    let sep = repository.url.endsWith('/') ? '' : '/', suffix = repository.name.endsWith('.git') ? '' : '.git';

    repository = _.merge({branch: {}}, defaults, repository, {
      href: (repository.url + '' + sep + '' + repository.name) + '' + suffix,
      version: argv.tag || (descriptor.version || defaults.version), //(repository.version || defaults.version),
      changelog: argv.changelog || (repository.changelog || (defaults.changelog || false))
    });

    let archetype = facets[repository.archetype] /*Use npm project type as defaukt facet*/;
    if(REGEX.test(repository.href) && archetype && (typeof archetype.enabled === 'undefined' || archetype.enabled)
      && (typeof archetype.which === 'undefined' || archetype.which)) {

      let directory = Path.join(CWD, '.djanta-bump');
      shell.mkdir('-p', directory); //With the -p option, the target working directory will be created if needed

      archetype.build (repository, directory, (data, err) => {});
    }
  });
};

if (HAS_GIT_INSTALLED && HAS_NPM_INSTALLED) {
  let descriptor = YAML.sync(argv.file /*Path.resolve(DIRNAME, DEFAULT_ROADMAP)*/), defaults = descriptor['defaults'];
  (argv['roadmap'] || Object.keys(descriptor)).forEach(name => _bump(name, descriptor[name], defaults));
}
else {
  shell.echo('Sorry, this script requires git');
  shell.exit(1);
}
