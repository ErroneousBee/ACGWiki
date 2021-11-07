/* global require */
const fs = require("fs");
const fse = require('fs-extra');
const js_yaml = require('js-yaml');
const sass = require('node-sass');

Config = {

    search: {
        // Valid search fields: "title", "description", "keywords", "body"
        fields: ["title", "description", "keywords", "body"],
        exclude: ["search.html"],
        max_preview_chars: 275,
    },
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

    console.log("Config Read: ", Config);


}

function copy_to_target() {

    // Copy all the files into the target directory
    const sources = [
        'index.html',
        'config.yaml',
        'src/main.js',
        'themes',
        'css',
        Config.contentpath,
    ];

    // Include configured plugins
    for (const plugin of Config.plugins) {
        sources.push('plugins/' + plugin + '/src/');
    }

    fse.emptyDirSync(Config.targetpath);

    for (const source of sources) {
        const dest = Config.targetpath + '/' + source;

        fse.copy(source, dest, {
                overwrite: true
            })
            .then(() => {
                console.log("Copied: ", source);
            })
            .catch(err => {
                console.error(err)
            });

    }

}

async function install_plugins() {

    // Run all the pluging build scripts
    for (const plugin of Config.plugins) {

        // if there is a sass in the src then build it
        const sasspath = 'plugins/' + plugin + '/plugin.scss';
        if (fs.existsSync(sasspath)) {

            console.log("Compile sass for plugin:", plugin);
            const res = sass.renderSync({
                file: sasspath,
                outputStyle: 'compact'
            });

            if (res.css) {
                fs.writeFileSync('plugins/' + plugin + '/src/plugin.css', res.css);
            } else {
                console.warn("No CSS generated from sass for plugin:", plugin);
            }
        } 

        let { build } = require('../plugins/' + plugin + '/build.js');
        await build(Config);
    }

    console.log("Installing plugins into index.html...");

    // Get all the new head and body source lines from configured plugins
    const html_head = [];
    const html_body = [];
    for (const plugin of Config.plugins) {
        html_head.push(...(fs.readFileSync('plugins/' + plugin + '/includes_head.html').toString().split("\n")));
        html_body.push(...(fs.readFileSync('plugins/' + plugin + '/includes_body.html').toString().split("\n")));
    }

    // Locate head section and fill it.
    const lines = fs.readFileSync('index.html').toString().split("\n");
    const head_start = lines.findIndex(l => l.includes(' <!-- Start of Plugins HEAD -->'));
    const head_end = lines.findIndex(l => l.includes(' <!-- End of Plugins HEAD -->'));
    lines.splice(head_start + 1, head_end - head_start - 1, ...html_head);

    // Locate body section and fill it
    const body_start = lines.findIndex(l => l.includes(' <!-- Start of Plugins BODY -->'));
    const body_end = lines.findIndex(l => l.includes(' <!-- End of Plugins BODY -->'));
    lines.splice(body_start + 1, body_end - body_start - 1, ...html_body);

    fs.writeFileSync('index.html', lines.join("\n"));

    console.log("Installed plugins: " + Config.plugins.join(", ") + ".");

}

function main() {

    read_config();

    install_plugins();

    copy_to_target();

}

main();