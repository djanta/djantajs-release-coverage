'use strict';

let path = require('path');
let fs = require('fs');
let shell = require('shelljs');

let hook = (name, version) => {
  let hook = path.join('.git', 'hooks', name), cmd = [hook, version].join(' ');
  if (fs.existsSync(hook)) {
    shell.exec(cmd, { silent: false });
  }
};

module.exports = {
  hook: hook,
  post: version => hook('post-release', version),
  pre: version => hook('pre-release', version),
  isGitPresent: () => fs.existsSync(path.join('.git'))
};
