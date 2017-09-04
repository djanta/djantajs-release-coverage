'use strict';

/* eslint no-sync:0 */

let fs = require('fs');
let path = require('path');

let version = require('cloudvog-teams-versioning');

module.exports = (grunt) => {
    process.env.BUILD_VERSION = version(grunt);

    require('load-grunt-tasks')(grunt);

    // Load all grunt tasks (modules) in the grunt-tasks directory
    grunt.loadTasks('grunt-tasks');

    var config = {
        e2eDir: './test-new/e2e',
        unitTestDir: './test-new/unit',
        testResultDir: './test-result'
    };

    var e2eDirs = () => {
        return fs.readdirSync(config.e2eDir).filter(function (file) {
            return fs.statSync(path.join(config.e2eDir, file)).isDirectory();
        });
    };

    var unitTestDirs = () => {
        return fs.readdirSync(config.unitTestDir).filter(function (file) {
            return fs.statSync(path.join(config.unitTestDir, file)).isDirectory();
        });
    };

    //grunt.loadNpmTasks('grunt-nodemon');
    //grunt.loadNpmTasks('grunt-mocha-test');

    var mochaTest = {
        'e2e-all': {
            options: {
                reporter: 'spec',
                quite: false,
                timeout: 3000
            },
            src: [config.e2eDir + '/**/*.js']
        },
        'e2e-predit': { // runs selected e2e tests and generates report in tap format
            options: {
                reporter: 'tap',
                quite: false,
                timeout: 10000
            },
            src: [
                // limit predit e2e tests to the one we know are not going to have negative impact on client/user
                config.e2eDir + '/monitoring/monitoring.js',
                config.e2eDir + '/feedback/feedback.js'/*,
                 config.e2eDir + '/scim/scim.js'*/
            ]
        },
        'unit-test-all': {
            options: {
                reporter: 'spec',
                quite: false,
                timeout: 3000
            },
            src: [config.unitTestDir + '/**/*.js']
        },
        'unit-test-coverage': { // runs all unit test and generates coverage report in html format
            options: {
                reporter: 'html-cov',
                require: 'test-new/blanket',
                quite: true,
                timeout: 3000
            },
            src: [config.unitTestDir + '/**/*.js']
        }
    };

    e2eDirs().forEach(function (_app) {
        mochaTest['e2e-' + _app] = {
            options: {
                reporter: 'spec',
                quite: false,
                timeout: 3000
            },
            src: [config.e2eDir + '/' + _app + '/*.js']
        };
    });

    unitTestDirs().forEach(function (_app) {
        mochaTest['unit-' + _app] = {
            options: {
                reporter: 'spec',
                quite: false,
                timeout: 3000
            },
            src: [config.unitTestDir + '/' + _app + '/**/*.js']
        };
    });

    require('load-grunt-tasks')(grunt);

    /*var eslint = {
     target: [ './' ]
     };*/

    grunt.initConfig({
        eslint: {target: ['./']},
        mochaTest: mochaTest,

        'node-inspector': {
            custom: {
                options: {
                    'web-host': 'localhost',
                    'web-port': 1337,
                    'debug-port': 5858,
                    'save-live-edit': true,
                    'preload': false,
                    'hidden': ['node_modules'],
                    'stack-trace-limit': 4
                }
            }
        },

        concurrent: {
            default: ['deamon', 'watch'],
            debug: ['deamon', 'watch', 'node-inspector'],
            options: {
                logConcurrentOutput: true
            }
        },

        /**
         The nodemon task will start your node server. The watch parameter will tell
         nodemon what files to look at that will trigger a restart. Full grunt-nodemon
         documentation
         **/
        nodemon: {
            dev: {
                script: 'app.js',
                options: {
                    cwd: __dirname,
                    /** Environment variables required by the NODE application **/
                    env: {
                        PORT: 3000,
                        NODE_ENV: "development",
                        NODE_CONFIG: "dev"
                    },
                    args: ['dev'],
                    watchedExtensions: ['js', 'json'],
                    ignoredFiles: ['node_modules/**'],
                    nodeArgs: ['--debug', '--max_old_space_size=4096', '--expose-gc'],
                    ignore: ['node_modules/**'],
                    watch: ["server"],

                    callback: function (nodemon) {

                        nodemon.events('log', function (event) {
                            console.log(event.colour);
                        });

                        // /** Open the application in a new browser window and is optional **/
                        // nodemon.on('config:update', function () {
                        //   // Delay before server listens on port
                        //   setTimeout(function() {
                        //     require('open')('http://127.0.0.1:8000');
                        //   }, 1000);
                        // });
                        //
                        // /** Update .rebooted to fire Live-Reload **/
                        // nodemon.on('restart', function () {
                        //   // Delay before server listens on port
                        //   setTimeout(function() {
                        //     require('fs').writeFileSync('.rebooted', 'rebooted');
                        //   }, 1000);
                        // });

                        /*// opens browser on initial server start
                         nodemon.on('config:update', function () {
                         // Delay before server listens on port
                         setTimeout(function() {
                         require('open')('http://localhost:3000');
                         }, 1000);
                         });

                         // refreshes browser when server reboots
                         nodemon.on('restart', function () {
                         // Delay before server listens on port
                         setTimeout(function() {
                         require('fs').writeFileSync('.rebooted', 'rebooted');
                         }, 1000);
                         });*/
                    },
                    delay: 1000,
                    legacyWatch: true
                }
            }
        }
    });

    // Default task(s).
    grunt.registerTask('default', ['lint', 'concurrent:default']);

    // Debug task.
    grunt.registerTask('debug', ['lint', 'concurrent:debug']);

    /**
     * Grunt task to run an embedded lint
     */
    grunt.registerTask('lint', ['eslint']);

    /**
     * Grunt task to run an embedded server
     */
    grunt.registerTask('server', ['default']);

    /**
     * Grunt task to run an embedded server
     */
    grunt.registerTask('unit', ['default']);

    grunt.registerTask('handle-capture-file', 'handles capture file', function (captureFile, configName) {
        var captureConfig = grunt.config(configName);
        captureConfig.options.captureFile = captureFile;
        grunt.config(configName, captureConfig);
        grunt.file.delete(captureFile);
    });

    grunt.registerTask('create-test-result-dirs', 'creates test result directories', function () {
        grunt.file.mkdir(config.testResultDir + '/e2e');
        grunt.file.mkdir(config.testResultDir + '/unit-test');
    });

    grunt.registerTask('config', 'displays effective grunt config', function () {
        grunt.log.writeln(JSON.stringify(grunt.config(mochaTest), null, 4));
    });

    var app = grunt.option('app');

    if (app) {
        grunt.registerTask('e2e', 'runs e2e tests for app ' + app, function () {
            var captureFile = config.testResultDir + '/e2e/' + app + '.txt';
            var configName = 'mochaTest.e2e-' + app;
            grunt.task.run([
                'handle-capture-file:' + captureFile + ':' + configName,
                'create-test-result-dirs',
                'mochaTest:e2e-' + app
            ]);
        });

        grunt.registerTask('unit-test', 'runs unit test for app ' + app, function () {
            var captureFile = config.testResultDir + '/unit-test/' + app + '.txt';
            var configName = 'mochaTest.unit-' + app;
            grunt.task.run([
                'handle-capture-file:' + captureFile + ':' + configName,
                'create-test-result-dirs',
                'mochaTest:unit-' + app
            ]);
        });
    } else {
        grunt.registerTask('e2e', 'runs all e2e tests', function () {
            var captureFile = config.testResultDir + '/e2e/all.txt';
            var configName = 'mochaTest.e2e-all';
            grunt.task.run([
                'handle-capture-file:' + captureFile + ':' + configName,
                'create-test-result-dirs',
                'mochaTest:e2e-all'
            ]);
        });

        grunt.registerTask('unit-test', 'runs all unit tests', function () {
            var captureFile = config.testResultDir + '/unit-test/all.txt';
            var configName = 'mochaTest.unit-test-all';
            grunt.task.run([
                'handle-capture-file:' + captureFile + ':' + configName,
                'create-test-result-dirs',
                'mochaTest:unit-test-all'
            ]);
        });
    }

    grunt.registerTask('test', 'runs all unit tests and e2e tests', ['unit-test', 'e2e']);

    grunt.registerTask('e2e-predit', 'runs limited e2e test cases again predit env', function () {
        var captureFile = config.testResultDir + '/e2e/result.tap';
        var configName = 'mochaTest.e2e-predit';
        grunt.file.delete(config.testResultDir + '/e2e/*.tap');
        grunt.task.run([
            'handle-capture-file:' + captureFile + ':' + configName,
            'create-test-result-dirs',
            'mochaTest:e2e-predit'
        ]);
    });

    grunt.registerTask('unit-test-coverage', 'runs all unit tests and create coverage report', function () {
        var captureFile = config.testResultDir + '/unit-test/coverage.html';
        var configName = 'mochaTest.unit-test-coverage';
        grunt.task.run([
            'handle-capture-file:' + captureFile + ':' + configName,
            'create-test-result-dirs',
            'mochaTest:unit-test-coverage'
        ]);
    });
};
