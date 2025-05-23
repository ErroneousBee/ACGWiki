/* eslint-disable no-unused-vars */
Config = {
    title: 'Default Title',
    extension_precedence: ["md", "html", "htm", "txt"],
    theme: 'default',
    home: 'Home.md',
    search: 'Search.md',
    navigation_sidebar: 'Navigation.md',
    navigation_topbar: 'Navigation.md',
    contentpath: 'content/'
};


App = {

    Plugins: [], // Plugins will register themselves here in plugin init.
    Registry: {
        path_divert: [] // Functions to call for specific paths
    },

    async onload() {

        // First, we wait for the config, how else will we know what to do?
        await App.load_config();

        App.load_theme();

        // Run all plugin initialisers
        for (const plugin of Config.plugins) {
            try {
                App.Plugins[plugin].initialise();
            } catch (error) {
                console.error("No initialise function found for plugin: " + plugin);
                console.warn("Activate plugins in the config, then run 'npm run build' to install plugins into index.html.");
            }
        }

        // Load the assorted navigation, banners and whatnot.
        App.load_side_content();

        // We navigate by setting hashes in the URL.
        window.onhashchange = App.load_content_from_url;

        // Now for the main event...
        App.load_content_from_url();


    },

    /**
     * Try to load a resource from one of the many possible extensions
     * @param {String} path 
     * @param {Array} extn_list 
     */
    fetch_with_extention(path, extn_list) {

        const extn = extn_list.shift();

        return new Promise((resolve, reject) => {
            fetch(path + '.' + extn)
                .then(response => {

                    // Nope, try next filetype.
                    if (!response.ok) {
                        if (extn_list.length === 0) {
                            reject("Ran out of extensions to try");
                            return;
                        }
                        return this.fetch_with_extention(path, extn_list);
                    }

                    // Make more info into the response and resolve the promise.
                    response.filename = response.url.split('/').pop();
                    response.filetype = response.filename.slice((response.filename.lastIndexOf(".") - 1 >>> 0) + 2);
                    resolve(response);
                })
                .catch(e => {
                    reject(e);
                })
        });

    },

    /**
     * Read the config.yaml file, and merge into hardcoded defaults.
     */
    async load_config() {
        await fetch("config.yaml")
            .then(response => response.text())
            .then(text => {
                try {
                    const json = jsyaml.load(text);
                    for (const item in json) {
                        Config[item] = json[item];
                    }
                } catch (e) {
                    console.error("Failure getting configuration from config.yaml", e);
                    return;
                }

                if (Config.show_config) {
                    console.log("Configuration:", Config);
                }

            });

    },

    /**
     * Driven by onhaschange events. Look at the current URL and load the content based on that URL.
     */
    load_content_from_url(event) {

        const url = new URL(window.location.href);

        // Reset ( remove ) any classes applied to the article by plugins.
        document.getElementById("content").removeAttribute("class");

        // We use the hash part of the URL for the path 
        let path = url.hash.slice(1);
        if (path === '') {
            path = Config.home;
        }

        // Is this reserved by a plugin?
        const divert = App.Registry.path_divert.find(e => path.startsWith(e.path));
        if (divert) {
            divert.handler(path, Config, document.getElementById("content"));
            return;
        }

        // Is this something we dont handle, like a pdf file?
        const isexternal = Config.external_types.map(type => path.endsWith("." + type)).includes(true);
        if (isexternal) {
            window.location.href = url.origin + "/" + Config.contentpath + path;
            return;
        }

        // Must be a normal bit of content for us to display.
        App.read_path_into_element(path, document.getElementById("content"));

    },

    /**
     * Make the URL reflect the path we have.
     * @param {string} path 
     */
    set_url(path) {

        const url = new URL(window.location.href);
        url.hash = '#' + path;
        window.location.href = url.toString();

    },

    /**
     * Directly read a file into an element, for non-content such as navbars.
     * @param {*} file 
     * @param {*} element 
     */
    read_file_into_element(file, element) {

        // Get the file type
        let filename = file.split('/').pop();
        let filetype = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);

        return fetch(file)
            .then(response => {
                if (!response.ok) {
                    throw new Error(response.statusText)
                }
                return response.text()
            })
            .then(text => {

                switch (filetype) {
                    case "htm":
                    case "html":
                        element.innerHTML = text;
                        break;

                    case "md": {
                        const [html,] = App.convert_markdown_page(text, file);
                        element.innerHTML = html;
                        break;
                    }

                    default:
                        element.innerHTML = text;
                        break;

                }

            }).catch(e => {
                console.error(e);
                element.innerHTML = '<p class="error">' + e + '.</p><p>File: ' + file + '</p>';
            });

    },

    /**
     * Read content path into the content element, update any navbars along the way.
     * @param {*} path - fie name including extension and directory levels
     * @param {*} element - DOM element to put the content into
     */
    read_path_into_element(path, element) {

        // Get the file type
        const filename = path.split('/').pop();
        const filetype = filename.slice((filename.lastIndexOf(".") - 1 >>> 0) + 2);

        // If we were given a filetype, remove it and add it to front of the list to try first
        const extn_list = [...Config.extension_precedence];
        if (filetype !== "") {
            extn_list.unshift(filetype);
            path = path.substring(0, path.lastIndexOf("."));
        }

        // Clear the subtitle
        document.querySelector("header span.subtitle").innerHTML = "";
        document.title = path;

        // TODO: Try "path" 
        App.fetch_with_extention(Config.contentpath + path, extn_list)
            .catch(e => {
                // That didnt work, lets try appending Config.home
                return App.fetch_with_extention(Config.contentpath + path + "/" + Config.home, [...Config.extension_precedence])
            })
            .then(response => {

                response.text().then(text => {

                    // Despstch an event in case some plugin is listening.
                    const event = new CustomEvent('pathloaded', {
                        path: path
                    });
                    document.dispatchEvent(event);

                    App.write_content_into_element(response.url, response.filetype, element, text);

                });

            })
            .catch(e => {
                console.error(e);
                element.innerHTML = '<p class="error">' + e + '.</p><p>Path: ' + path + '</p>';
            });

    },

    /**
     * Convert and write some content into an element, mostly the content into the main content area. 
     * @param {*} source 
     * @param {*} filetype 
     * @param {*} element 
     * @param {*} text 
     */
    write_content_into_element(source, filetype, element, text) {

        switch (filetype) {
            case "htm":
            case "html":
                element.innerHTML = text;
                break;

            case "md": {
                const [html, json] = App.convert_markdown_page(text, source);

                // Set title/theme, etc based on page frontmatter
                App.handle_frontmatter(json);

                // Tell a plugin to do its stuff, or render the page.
                if (json.plugin) {
                    try {
                        App.Plugins[json.plugin].onpageload(json, html, element, source);
                    } catch (error) {
                        console.error("Could not run plugin " + json.plugin + " for page " + source);
                        console.warn("Activate plugins in the config, then run 'npm run build' to install plugins into index.html.");
                    }
                } else {
                    element.innerHTML = html;
                    App.fix_links(element);
                    App.fix_image_paths(element);
                }

                break;
            }

            default:
                element.innerHTML = text;
                break;

        }

    },

    /**
     * Set the page title and other stuff based on the frontmatter
     * @param {Object} json - json object derived from a pages frontmatter
     */
    handle_frontmatter(json) {

        if (json.title) {
            document.querySelector("header span.subtitle").innerHTML = json.title;
            document.title = json.title;
        }
        if (json.class) {
            document.getElementById("content").classList.add(json.class);
        }

        // Loads or resets the theme
        App.load_theme(json.theme);
    },

    /**
     * Given the md file contents, strip and deal with the yaml frontmatter, and give us the md text.
     * @param {string} text - the text of the markdown file.
     * @param {string} source - a string for indicating where errors come from
     */
    convert_markdown_page(text, source) {

        let fm, md;
        // First line is the seperator, its yaml and therefore ---
        // TODO: Improve to get fm and md if no sep, or if <hr> exists
        const sep = text.split("\n", 1)[0].trim();
        if (sep === '---') {
            const lines = text.split('\n');
            const l1 = lines.indexOf('---', 1);
            fm = lines.slice(1, l1).join('\n');
            md = lines.slice(l1 + 1).join('\n');
        } else {
            console.warn("No front matter found for", source);
            fm = 'title: ' + (new URL(source)).pathname;
            md = text;
        }

        try {
            const json = jsyaml.load(fm);
            const converter = new showdown.Converter({
                noHeaderId: true,
                customizedHeaderId: true,
                parseImgDimensions: true,
                tables: true,
                tasklists: true

            });
            return [converter.makeHtml(md), json];
        } catch (e) {
            console.error("Failure reading page frontmatter from ", source, e);
            return ['<p class="error">Error loading page from ' + source + '</p><p>' + e.message + '</p>', {}];
        }

    },

    /**
     * Populate the sidebar and other non content places.
     */
    load_side_content() {

        // Mobile and Desktop logos
        document.querySelectorAll("div.logo, span.logo")
            .forEach(el => App.read_file_into_element(Config.contentpath + Config.navigation_logo, el));

        // The config title
        document.querySelector("header span.title").innerHTML = Config.title;

        // Load and interfere with the side navbar
        App.read_file_into_element(Config.contentpath + Config.navigation_sidebar, document.getElementById("navigation_sidebar"))
            .then(() => {
                // Insert spans of the sidebar texts to allow hover niceness
                const navlinodes = document.querySelector("nav#navigation_sidebar").querySelectorAll("li");
                for (const node of navlinodes) {
                    const child = node.firstChild;
                    const span = document.createElement("span");
                    span.appendChild(child.cloneNode(true));
                    span.classList.add("navline");
                    child.replaceWith(span);
                }
            });

        // The navigation in the header
        App.read_file_into_element(Config.contentpath + Config.navigation_topbar, document.getElementById("navigation_topbar"));

        // Click in the nav sidebar
        document.querySelector("nav#navigation_sidebar").onclick = App.nav_sidebar_click_handler;

        // Click on the header navigation toolbar
        document.querySelector("nav#navigation_topbar").onclick = App.nav_topbar_click_handler;

    },

    /**
     * User has clicked in the side navbar menu, squeeze the bellows or navigate accordionly.
     * @param {*} event 
     */
    nav_sidebar_click_handler(e) {

        e.preventDefault();

        const target_li = e.target.closest("li");
        const has_children = [...target_li.children].filter(el => el.tagName === "UL").length > 0;

        // If its got li children, fix open accordiant
        if (has_children) {
            target_li.classList.toggle("open");
            return;
        }

        const path = App.get_path_from_element(e.target);
        App.set_url(path);

    },

    /**
     * User has clicked in the top navbar menu, drop menu or navigate accordionly.
     * @param {*} event 
     */
    nav_topbar_click_handler(e) {

        e.preventDefault();

        const li = e.target.closest("li");

        // If we have a "ul" in here, its a further menu
        if (li.lastElementChild && li.lastElementChild.tagName === "UL") {

            // Toggle clicked, turn off all siblings
            const isopen = li.lastElementChild.classList.contains("open");
            li.closest("ul").querySelectorAll("li>ul.open").forEach(sibling => sibling.classList.remove("open"));

            if (!isopen) {
                li.lastElementChild.classList.add("open");
            }

        } else {
            // Close all nav menus
            document.querySelectorAll("nav#navigation_topbar ul.open").forEach(sibling => sibling.classList.remove("open"));

            // Open path
            const path = App.get_path_from_element(li);
            App.set_url(path);
        }

    },

    /**
     * From the li element of a nav manu, go up the tree to the nav element, and get a path that is the page to load.
     * @param {Element} el 
     * @param {string} acc - accumulator, null to begin with, then its a string.
     */
    get_path_from_element(el, acc) {

        el = el.closest("li, nav");

        // Identify where the nav info is
        let span_el = el;
        if (el.firstChild.tagName === "SPAN") {
            span_el = el.firstChild;
        }

        // Get the text that forms part of this path from the href or the text
        let pathpart = '';
        const els = [...span_el.children].filter((elx) => elx.tagName === "A" && elx.hasAttribute("href"));
        if (els.length > 0) {
            pathpart = els[0].getAttribute("href").slice(1);
        } else {
            pathpart = span_el.firstChild.nodeValue.trim();
        }
        if (acc) {
            pathpart = pathpart + "/" + acc;
        }

        // Fully qualified path indicated by leading slash.
        if (pathpart.slice(0, 1) === "/") {
            return pathpart.slice(1);
        }

        // navigate up to the parent <li> or <nav>
        const elp = el.parentElement.closest("li, nav");

        if (elp.tagName === "NAV") {
            return pathpart;
        }

        return App.get_path_from_element(elp, pathpart);

    },

    /**
     * Edit all links so that they work as expected for the authors of pages.
     * @param {*} element - probably the dif that you have just loaded a markdown file into.
     */
    fix_links(element) {

        const b = window.location.href;
        const base = b.substr(0, b.lastIndexOf("/"));

        // Insert spans of the sidebar texts to allow hover niceness
        const links = element.querySelectorAll("a");
        for (const link of links) {

            // External links get left alone
            if (window.location.origin !== link.origin) {
                continue;
            }

            // Fully qualified hashs get left alone 
            const href = link.getAttribute("href");
            if (href.startsWith("#/") || href.startsWith("/")) {
                continue;
            }

            // Remove the file from the baseURI 
            const newURI = base + "/" + href.replace(/^#/, '');
            link.setAttribute("href", newURI);

        }

    },

    /**
     * Alter image src attributes to include the current path, and make it clickable to show image.
     * @param {element} element - The element you wish to fix paths within
     */
    fix_image_paths(element) {

        // Create a suitable full path for the current page in case the image paths are relative
        const pageURL = new URL(window.location.href);
        // '' #Home #Map #Map/Home #species/Home 
        // TODO: Find a way of dealing with non-home paths
        let path = pageURL.hash;
        if (path.startsWith('#')) {
            path = path.slice(1);
        }
        if (path.endsWith(Config.home)) {
            path = path.slice(0, -(Config.home.length));
        }
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        // Pull all the images from the grid
        for (const img of element.querySelectorAll("img")) {

            const file = img.getAttribute("src");

            // Opens with overlay unless supressed
            if (!img.classList.contains('nooverlay')) {
                img.onclick = App.open_image.bind(null, element);
            }

            // Is this fully qualified or an external path? 
            if (!file.startsWith("/") && !file.startsWith("http")) {
                img.setAttribute("src", Config.contentpath + path + '/' + file);
            }

        }

    },

    /**
     * View an image in a container overlay that dismisses when clicked
     * @param {element} article_el 
     * @param {event} event 
     */
    open_image(article_el, event) {

        const show = document.createElement('div');
        show.className = "image_overlay";
        show.onclick = () => show.remove();

        const image = document.createElement('img');
        image.src = event.target.src;
        show.appendChild(image);
        article_el.appendChild(show);

    },

    /**
     * Set the theme href.
     * @param {String} name - A String like "dark" or "light", or false/null for the config default.
     */
    load_theme(name) {
        const theme = (name) ? name : Config.theme;
        document.querySelector("link#theme_colors").setAttribute("href", "themes/" + theme + "/colors.css");
        document.querySelector("link#theme_layout").setAttribute("href", "themes/" + theme + "/layout.css");
        document.querySelector("link#theme_icon").setAttribute("href", "themes/" + theme + "/favicon.ico");
    },

    /**
     * Inform the page loader that this path is to be handled by a plugin
     * @param {*} path - Any paths that start with this will get the callback called
     * @param {*} callback - A function to be called when the path changes to this path
     */
    register_divert(path, callback) {
        App.Registry.path_divert.push({
            path: path,
            handler: callback
        })
    }


};