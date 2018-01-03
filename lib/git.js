'use strict';

const shell = require('shelljs');

let _tag = {
  rename: (name, directory = __dirname) => {}
};

module.exports = {
  tag: _tag,
  head: (directory = __dirname) => {
    shell.cd(directory); //Jump into the git project directory
    return shell.exec('git rev-parse --abbrev-ref HEAD', {silent:true}).stdout;
  }
};
