const _ = require('lodash');
const fs = require('fs');
const path = require('path');
const build = require('./builder');
const { time, timeEnd, } = require('../utils');
const FileUpdates = require('../utils/fileUpdates');
const normalize = require('../template');
const parse = require('../parser');
const AST = require('../ast');

let allTypings = null;

const getAllTypings = config => {
    if(!allTypings) {
        const allTypingsPath = config.cacheDir + path.sep + 'allTypings.json';
        if(fs.existsSync(allTypingsPath)) {
            try {
                allTypings = JSON.parse(fs.readFileSync(allTypingsPath, 'utf8'));
            }
            catch(e) {
                console.error('Failed to load all typings', e);
            }
        }
    }

    if(!allTypings) {
        allTypings = {};
    }

    return allTypings;
};

const flush = (config) => {
    const allTypingsPath = config.cacheDir + path.sep + 'allTypings.json';
    const allTypings = getAllTypings(config);
    fs.writeFileSync(allTypingsPath, JSON.stringify(allTypings));
};

const slim = target => {
    if(_.isPlainObject(target)) {
        return _.chain(target)
            .toPairs()
            .reject(pair => _.isEmpty(pair[1]))
            .map(([key, value]) => [key, slim(value)])
            .fromPairs()
            .value();
    }
    else if(_.isArray(target)) {
        return _.map(target, slim);
    }
    else {
        return target;
    }
};

const add = (node, config) => {
    const typeDeclaration = AST.getTopLevelType(node);

    const typings = build(typeDeclaration, {
        includeComments: false,
    });

    const allTypings = getAllTypings(config);
    allTypings[typings.name] = slim(typings);
};

const scan = (fileName, config) => {
    time(`Scan file ${fileName}`, config);

    return new Promise((resolve, reject) => {
        if(!FileUpdates.hasChanged(fileName, config)) {
            resolve(null);
        }
        else {
            fs.readFile(fileName, 'utf8', (error, src) => {
                timeEnd(`Scan file ${fileName}`, config);
                if(error) {
                    reject(error);
                }

                try {
                    if(!fileName.endsWith('.cls')) {
                        time('Normalize', config);
                        src = normalize(src, config);
                        timeEnd('Normalize', config);
                    }

                    time('Parse', config);
                    const result = parse(src);
                    timeEnd('Parse', config);

                    add(result, config);

                    resolve(result);
                }
                catch(e) {
                    if(config.ignoreErrors) {
                        console.error(new Error(`Failed to scan ${fileName}:\n${e}`));
                        resolve(null);
                    }
                    else {
                        reject(new Error(`Failed to scan ${fileName}:\n${e}`));
                        console.error(`Failed to scan ${fileName}`);
                        throw e;
                    }
                }
            });
        }
    });
};

const Typings = {
    add,
    scan,
    getAllTypings,
    flush,
};

module.exports = Typings;