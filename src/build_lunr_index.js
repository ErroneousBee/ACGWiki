/**
 * Orininal code from https://github.com/BLE-LTER/Lunr-Index-and-Search-for-Static-Sites
 */

/* global require */
const path = require("path");
const fs = require("fs");
const lunr = require("lunr");
const cheerio = require("cheerio");
const js_yaml = require('js-yaml');
const { htmlToText } = require('html-to-text');
const pdf_util = require('pdf-to-text');

// Default values for config, read_config() will add from yaml file.+
const Config = {
    // Valid search fields: "title", "description", "keywords", "body"
    search_fields: ["title", "description", "keywords", "body"],
    search_exclude: ["search.html"],
    search_max_preview_chars: 275,
    search_lunr_index: "src/lunr_index.js",
    contentpath: "content"
};

/**
 * Returns an array of file paths.
 * @param {String} folder B35
 */
function find_files(folder) {
    if (!fs.existsSync(folder)) {
        console.log("Could not find folder: ", folder);
        return [];
    }

    const files = fs.readdirSync(folder);
    const sources = [];
    for (const file of files) {
        const filename = path.join(folder, file);
        const filetype = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);
        const stat = fs.lstatSync(filename);

        // Ignore listed files or paths, or unconfigured file types  
        if (Config.search_exclude.includes(file)) {
            continue;
        }
        if (Config.search_exclude.includes(filename)) {
            continue;
        }

        // Files we cant handle
        if (stat.isFile() && !Config.search_filetypes.includes(filetype)) {
            continue;
        }

        // Get the file, or a list of files
        if (stat.isDirectory()) {
            sources.push(find_files(filename));
        } else {
            sources.push(filename);
        }

    }

    return sources.reduce((acc, val) => acc.concat(val), []);
}

/**
 * Turn an html file into a lunr search object
 * @param {*} filename 
 * @param {*} fileId 
 */
function html_to_lunr_doc(filename, fileId) {
    const txt = fs.readFileSync(filename).toString();

    const linkpath = filename.slice(Config.contentpath.length);

    const $ = cheerio.load(txt);
    const title = $("title").text() || $("h1").text() || $("h1").text().split(" ").slice(5).join(" ");
    const description = $("meta[name=description]").attr("content") || "";
    const keywords = $("meta[name=keywords]").attr("content") || "";
    const body = $("body").text() || "";
    return {
        "id": fileId,
        "link": linkpath,
        "t": title,
        "d": description,
        "k": keywords,
        "b": body
    }
}

/**
 * Turn a markdown or text file into a lunr search object
 * @param {*} filename 
 * @param {*} fileId 
 */
function markdown_to_lunr_doc(filename, fileId) {

    const text = fs.readFileSync(filename).toString();

    // First line is the seperator
    const sep = text.split("\n", 1)[0].trim();
    const [fm, body] = text.split("\n" + sep, 2);
    let json = {};
    try {
        json = js_yaml.safeLoad(fm) || {};
    } catch (e) {
        console.error("Failure reading page frontmatter from ", filename, e);
    }

    return {
        "id": fileId,
        "link": filename.slice(Config.contentpath.length),
        "t": json.title || "",
        "d": json.description || "",
        "k": json.keywords || json.tags || "",
        "b": body
    }
}

/**
 * 
 * @param {String} filename 
 * @param {*} fileId 
 */
async function pdf_to_lunr_doc(filename, fileId) {

    const info_promise = () => {
        return new Promise((resolve, reject) => {
            pdf_util.info(filename, function (err, info) {
                if (err) return reject(err);
                resolve(info);
            });
        })
    };

    const text_promise = () => {
        return new Promise((resolve, reject) => {
            pdf_util.pdfToText(filename, function (err, data) {
                if (err) return reject(err);
                resolve(data); 
            });
        })
    };

    const text = await text_promise();
    const info = await info_promise();

    return {
        "id": fileId,
        "link": filename.slice(Config.contentpath.length),
        "t": info.title || "PDF Document",
        "d": info.description || "",
        "k": info.keywords || "",
        "b": text
    }
}


function buildIndex(docs) {
    var idx = lunr(function () {
        this.ref('id');
        for (var i = 0; i < Config.search_fields.length; i++) {
            this.field(Config.search_fields[i].slice(0, 1));
        }
        docs.forEach(function (doc) {
            this.add(doc);
        }, this);
    });
    return idx;
}

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

function buildPreviews(docs) {
    var result = {};

    for (const doc of docs) {

        let preview = doc.d;
        if (preview == "") {
            preview = htmlToText(doc.b, {}).slice(0, Config.search_max_preview_chars) + " ...";
        }
        result[doc["id"]] = {
            "t": doc["t"],
            "p": preview,
            "l": doc["link"]
        }
    }
    return result;
}


async function main() {

    read_config();

    // Get all the content files and convert them to lunr doc objects
    const files = find_files(Config.contentpath);
    var docs = [];
    console.log("Building index for these files:");
    for (var i = 0; i < files.length; i++) {
        console.log("    " + files[i]);
        if (files[i].endsWith(".html")) {
            docs.push(html_to_lunr_doc(files[i], i));
        } else if (files[i].endsWith(".md")) {
            docs.push(markdown_to_lunr_doc(files[i], i));
        } else if (files[i].endsWith(".txt")) {
            docs.push(html_to_lunr_doc(files[i], i));
        } else if (files[i].endsWith(".pdf")) {
            const obj = await pdf_to_lunr_doc(files[i], i);
            console.log(obj);
            docs.push(obj);
        }
    }

    // Use lunr to create the index, and a map of files:preview_texts.
    var idx = buildIndex(docs);
    var previews = buildPreviews(docs);


    var js = "const LUNR_DATA = " + JSON.stringify(idx) + ";\n" +
        "const LUNR_PREVIEW_LOOKUP = " + JSON.stringify(previews) + ";";
    fs.writeFile(Config.search_lunr_index, js, function (err) {
        if (err) {
            return console.log(err);
        }
        console.log("Index saved as " + Config.search_lunr_index);
    });
}

main();