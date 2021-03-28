/* global require */
const path = require("path");
const fs = require("fs");
const fse = require('fs-extra');
const js_yaml = require('js-yaml');

const Config = {
    // Valid search fields: "title", "description", "keywords", "body"
    search_fields: ["title", "description", "keywords", "body"],
    search_exclude: ["search.html"],
    search_max_preview_chars: 275,
    search_lunr_index: "src/lunr_index.js",
    contentpath: "content",
    targetpath: "target"
};

function read_config() {

    const text = fs.readFileSync("config.yaml").toString();

    try {
        const json = js_yaml.safeLoad(text);
        for (const item in json) {
            Config[item] = json[item];
        }
    } catch (e) {
        console.error("Failure getting configuration from config.yaml", e);
        return;
    }

}

function main() {

    read_config();
    console.log("Config Read: ", Config);

    const sources = [
        'index.html',
        'favicon.ico',
        'config.yaml',
        'src/main.js',
        'src/lunr_search.js',
        'themes',
        'css',
        Config.search_lunr_index,
        Config.contentpath,
    ];

    fse.emptyDirSync(Config.targetpath);

    for (const source of sources) {
        const dest = Config.targetpath + '/' + source;

        console.log("Copy", source, dest);

        fse.copy(source, dest, { overwrite: true })
            .then(() => {
                console.log("Copied: ", source);
            })
            .catch(err => {
                console.error(err)
            });

    }
}

main();