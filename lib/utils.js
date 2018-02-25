'use strict';

const Path = require('path');
const Fs = require('fs');

const isFile = source => source && Fs.existsSync(source) && Fs.statSync(source).isFile();
const isDirectory = source => source && Fs.existsSync(source) && Fs.statSync(source).isDirectory();

const REGEX = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;

module.exports = {
  isDirectory: isDirectory,
  isFile: isFile,
  isUrl: url => REGEX.test(url)
};
