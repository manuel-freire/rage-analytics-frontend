/*
 * Copyright 2016 e-UCM (http://www.e-ucm.es/)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * This project has received funding from the European Union’s Horizon
 * 2020 research and innovation programme under grant agreement No 644187.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0 (link is external)
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * This file is used to generate 'config.js' (used during execution 'npm start') and
 * 'config-test.js' (used while testing 'npm test') files.
 *
 * In order to create the files, needs some predefined values stored in 'config-values.js'.
 * For more information about these values, checkout 'config-values.js'.
 *
 * config.js is generated using the 'defaultValues' from 'config-values.js'.
 * config-test.js is generated using the 'testValues' from 'config-values.js'.
 * *
 * Usage:
 *
 *      'npm run setup' - Generates the files asking the user for the values and suggesting the default values from 'config-values.js'.
 *      'npm run fast-setup' - Generates the files directly using the values from 'config-values.js'.
 *
 */

var Fs = require('fs');
var Path = require('path');
var Async = require('async');
var Promptly = require('promptly');
var Handlebars = require('handlebars');

var configTemplatePath = Path.resolve(__dirname, '../app/config-example.js');
var configTestPath = Path.resolve(__dirname, '../app/config-test.js');
var configPath = Path.resolve(__dirname, '../app/config.js');

var environmentVarsPath = Path.resolve(__dirname, '../app/public/js/env-vars.js');
var environmentVarsTemplatePath = Path.resolve(__dirname, '../app/public/js/env-vars-example.js');

var configValue = require(Path.resolve(__dirname, '../app/config-values.js'));
var defaultValues = configValue.defaultValues;
var testValues = configValue.testValues;

if (process.env.NODE_ENV === 'test') {

    var options = {
        encoding: 'utf-8'
    };
    var source = Fs.readFileSync(configTemplatePath, options);
    var configTemplate = Handlebars.compile(source);
    Fs.writeFileSync(configPath, configTemplate(defaultValues));
    Fs.writeFileSync(configTestPath, configTemplate(testValues));

    var envSource = Fs.readFileSync(environmentVarsTemplatePath, options);
    var envTemplate = Handlebars.compile(envSource);
    Fs.writeFileSync(environmentVarsPath, envTemplate(defaultValues));

    console.log('Setup complete.');
    process.exit(0);

} else {
    Async.auto({

        projectName: function (done) {

            var promptOptions = {
                default: defaultValues.projectName || 'Analytics Frontend'
            };

            Promptly.prompt('Project name: (' + promptOptions.default + ')', promptOptions, done);
        },
        companyName: ['projectName', function (done) {

            var promptOptions = {
                default: defaultValues.companyName || 'e-UCM Research Group'
            };

            Promptly.prompt('Company name: (' + promptOptions.default + ')', promptOptions, done);
        }],
        apiPath: ['companyName', function (done) {

            var promptOptions = {
                default: defaultValues.apiPath || 'localhost:3000/api'
            };

            Promptly.prompt('API root path: (' + promptOptions.default + ')', promptOptions, done);
        }],
        port: ['apiPath', function (done) {

            var promptOptions = {
                default: defaultValues.port || 3350
            };

            Promptly.prompt('API port: (' + promptOptions.default + ')', promptOptions, done);
        }],
        appPrefix: ['port', function (done) {

            var promptOptions = {
                default: defaultValues.appPrefix || 'gleaner'
            };

            Promptly.prompt('Application prefix: (' + promptOptions.default + ')', promptOptions, done);
        }],
        createConfig: ['appPrefix', function (done, results) {

            var fsOptions = {
                encoding: 'utf-8'
            };

            Fs.readFile(configTemplatePath, fsOptions, function (err, src) {

                if (err) {
                    console.error('Failed to read config-example template.');
                    return done(err);
                }

                for (var result in results) {
                    if (results.hasOwnProperty(result)) {
                        defaultValues[result] = results[result];
                    }
                }

                var configTemplate = Handlebars.compile(src);
                Fs.writeFile(configPath, configTemplate(defaultValues), function (err) {
                    if (err) {
                        console.error('Failed to write config.js file.');
                        return done(err);
                    }
                    Fs.writeFile(configTestPath, configTemplate(testValues), function (err) {
                        if (err) {
                            console.error('Failed to write config-test.js file.');
                            return done(err);
                        }

                        var envSource = Fs.readFileSync(environmentVarsTemplatePath, fsOptions);
                        var envTemplate = Handlebars.compile(envSource);
                        Fs.writeFile(environmentVarsPath, envTemplate(defaultValues), function (err) {
                            if (err) {
                                console.error('Failed to write anv-vars.js file.');
                                return done(err);
                            }
                            done();
                        });
                    });
                });

            });
        }]
    }, function (err) {

        if (err) {
            console.error('Setup failed.');
            console.error(err);
            return process.exit(1);
        }

        console.log('Setup complete.');
        process.exit(0);
    });
}