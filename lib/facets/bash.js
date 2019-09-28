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
  which: true,
  name: 'bash'
};
