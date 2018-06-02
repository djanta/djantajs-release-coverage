'use strict';

// let Path = require('path');
let fs = require('fs');

let isFile = source => source && fs.existsSync(source) && fs.statSync(source).isFile();
let isDirectory = source => source && fs.existsSync(source) && fs.statSync(source).isDirectory();

let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let REGEX = /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/;
let int = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

module.exports = {
  isDirectory: isDirectory,
  isFile: isFile,
  isUrl: url => REGEX.test(url),
  random: len => {
    let buf = [], charlen = chars.length;
    for (let i = 0; i < len; ++i) {
      buf.push(chars[int(0, charlen - 1)]);
    }
    return buf.join('');
  },
  IDS: {
    allow: [
      'major',
      'premajor',
      'minor',
      'preminor',
      'patch',
      'prepatch',
      'prerelease',
      'from-git'
    ]
  }
};
