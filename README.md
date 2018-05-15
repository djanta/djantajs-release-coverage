# djantaio-tools-bump

[![npm version](https://img.shields.io/npm/v/djantaio-tools-bump?style=flat-square)](https://www.npmjs.com/package/djantaio-tools-bump)
[![npm downloads](https://img.shields.io/npm/dm/djantaio-tools-bump.svg?style=flat-square)](https://www.npmjs.com/package/djantaio-tools-bump)
[![GitHub tag](https://img.shields.io/github/tag/djanta/djantaio-tools-bump)](https://github.com/djanta/djantaio-tools-bump/tags)
[![Github All Releases](https://img.shields.io/github/downloads/djanta/djantaio-tools-bump/latest/total.svg)](https://github.com/djanta/djantaio-tools-bump/releases)
[![Build Status](https://travis-ci.org/djanta/djantaio-tools-bump.svg?branch=master)](https://travis-ci.org/djanta/djantaio-tools-bump)
[![Dependencies](https://david-dm.org/djanta/djantaio-tools-bump.svg)](https://david-dm.org/bigstickcarpet/djantaio-tools-bump)
[![License](https://img.shields.io/npm/l/djantaio-tools-bump.svg)](LICENSE)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=flat-square)](https://gitter.im/djantajs/tools?utm_source=share-link&utm_medium=link&utm_campaign=share-link)

> Uses djanta platform plugin bumping tools.

#### Automate your release process with a single command that can:

 * Optionally prompt for the type of version bump (major, minor, revision, beta, etc.)
 * Bump the version number in all of your JSON manifests, including:
    -  `package.json`
    -  `bower.json`
    -  `component.json`
 * Replace version number strings in text files, including:
    -  config files
    -  source code
    -  README files
    -  license files
 * Run your `preversion`, `version`, and `postversion` scripts
 * Commit changes to GIT
 * Tag the commit with the version number
 * Push the commit to remote


Installation
--------------------------
You can install `djantaio-tools-bump` via [npm](https://docs.npmjs.com/getting-started/what-is-npm).

```bash
npm install -g djantaio-tools-bump
```


Usage
--------------------------

```bash
Usage: djantaio-bump [options]

Options:

  -f, --file           Define where to load the roadmap from  [required] [default: "./release.yml"]
  -u, --url-prefix     Specify the Git repository host prefix
  -t, --semver-tag     Define the default semver strategy to use
  -M, --master-branch  Specify the default working repositiory defaut master branch name
  -D, --draft-branch   Specify the branch that has to be used as the default working branch
  -a, --archetype      Use this option to define what kind of the project artifact should be exclusivly bump  [default: "npm"]
  -c, --changelog      Use this option to define whether or not the change log file should be generated
  -e, --roadmap        Specify the roadmap list to execute  [array]
  -p, --git-project    Specify the local Git project directory
  --help               Show help  [boolean]

Examples:

  $ djantaio-bump --file <MANIFEST FILE> ...
  $ djantaio-bump --file <MANIFEST FILE> -e <ROADMAP NAME> -e <ROADMAP NAME2> -e <ROADMAP n...> ...
  $ djantaio-bump --file <MANIFEST FILE> --semver-tag <YOUR TAEGET VERSION> ...
```

Manifest Overview
--------------------------
As specified with the option `--file`, here below how you can declare your manifest file

```yaml
defaults:
  url: git@github.com:djanta
  origin: origin
  changelog: true
  archetype: npm
  branch:
    draft: develop
    master: master
  version: patch
  
prerelease:
  repositories:
    -
      tag: true
      name: djantaio-bump-test
      version: prerelease
      archetype: npm
      branch:
        master: master
        draft: develop
      command:
        - "npm install"
        - "npm run compile"
      dependencies:
        -
          name: lodash
          version: latest
        - dateutil
```

### Options

#### options.defaults
**Type**: `Object`

The default configuration remain the top level where you'd like to define all the common properties shared by bumping strategy such as your repository host url.

##### options.defaults.url
**Type**: `String` <br/>
**Default value**: ``

A string value that define your git repository host url. The property can overrided by the command line `-u, --url-prefix`

##### options.defaults.origin
**Type**: `String` <br/>
**Default value**: `origin`

A string value given to override the default repository url name.

#### options`.<#roadmap>`
**Type**: `Object`

Here's will take place your roadmap configuration.

##### options`.<#roadmap>`.repositories
**Type**: `Arrays` <br/>

Define the list of the target repository which should be bumped

###### options`.<#roadmap>`.repositories.tag
**Type**: `bool` <br/>
**Default value**: `true`

Define whether the current repository should be tagged. This's basically synomym of `enabled`

###### options`.<#roadmap>`.repositories.name
**Type**: `String` <br/>
**Default value**: ` ` <br/>
_**Required**_: `true`

Here's where you can define the target repository name without the `.git` extension.

###### options`.<#roadmap>`.repositories.archetype
**Type**: `String` <br/>
**Default value**: `npm` <br/>
_**Required**_: `true`

Define which archetype should be use to bump you project version. By the default `npm` archetype will be used. However, this can be overrided with the comment line `--archetype`

###### options`.<#roadmap>`.repositories.branch
**Type**: `Object` <br/>
**Default value**: 
```yaml
  branch:
    draft: develop
    master: master
```
_**Required**_: `true`

The branch configuration scope provide the way through to configure the working branch and the master branch. 
  - `draft` : the draft branch represent the current working branch where to tag from as the
  - `master`: branch reprsent to merge to after the working branch has been bumped and tagged 

Either `branch.draft` and `branch.master` can be overrided with the command lines `--draft-branch|-D` and `--master-branch|-M`

###### options`.<#roadmap>`.repositories.commad
**Type**: `Array` <br/>
**Default value**: ` ` <br/>
_**Required**_: `false`

The options `command` define a list of commad which should executed after bumping your project and before it's become tagged

###### options`.<#roadmap>`.repositories.dependencies
**Type**: `Array` <br/>
**Default value**: 
```yaml
  branch:
    draft: develop
    master: master
```
_**Required**_: `false`

Version Scripts
--------------------------
`djantaio-tools-bump` will execute your `preversion`, `version`, and `postversion` scripts, just like [the `npm version` command](https://docs.npmjs.com/cli/version) does. If your `package.json` file contains any or all of these scripts, then they will be executed in the following order:

  - The `preversion` script runs before the version is updated (and before the version prompt is shown)
  - The `version` script runs after the version is updated, but _before_ `git commit` and `git tag`
  - The `postversion` script runs after `git commit` and `git tag`, but _before_ `git push`

Contributing
--------------------------
I welcome any contributions, enhancements, and bug-fixes.  [File an issue](https://github.com/djanta/djantaio-tools-bump/issues) on GitHub and [submit a pull request](https://github.com/djantaio/djantaio-tools-bump/pulls).

#### Building
To build the project locally on your computer:

1. __Clone this repo__
```bash
git clone https://github.com/djanta/djantaio-tools-bump.git
```

2. __Install dependencies__
```bash
npm install
```

3. __Run the tests__
```bash
npm test
```



License
--------------------------
