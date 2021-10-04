App.Plugins.Search = {

    /* global lunr LUNR_DATA LUNR_PREVIEW_LOOKUP */
    index: lunr.Index.load(LUNR_DATA),
    previews: LUNR_PREVIEW_LOOKUP,

    keyup(e) {
        App.Plugins.Search.populate_results(e.target.value);

    },

    populate_results(value) {

        if (value === "") {
            document.querySelector("div.searchresults").innerHTML = '<hr/>';
            return;
        }

        const results = App.Plugins.Search.index.search(value);
        if (results.length === 0) {
            document.querySelector("div.searchresults").innerHTML = '<hr/><p>No results found.</p>';
            return;
        }

        let html = '<ul>';
        for (const result of results.slice(0, 10)) {

            const preview = App.Plugins.Search.previews[result.ref];

            html += '<li><a href="#' + preview.l + '">';
            html += '<span class="title">' + preview.t + '</span>';
            html += '<span class="link">' + preview.l + '</span><br/>';
            html += '<span class="preview">' + preview.p + '</span>';
            html += '</a></li>';
        }
        html += '</ul>';
        document.querySelector("div.searchresults").innerHTML = html;

    },


    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {

        // Add the icon to the toolbar
        const template = document.getElementById("lunr_search_icon_template").content.cloneNode(true);;
        document.getElementById("main_toolbar").appendChild(template);

        // Click on the search icon sets a path.
        document.querySelector("header span.search").onclick = () => {
            App.set_url(Config.search.path);
        }

        // Tell the page loader to call our onactivate when it sees a path called "Search"
        App.register_divert(Config.search.path, App.Plugins.Search.onactivate)

    },

    async onactivate(path, config, element) {
        console.log("Search Activated", path, config, element);

        // Copy the search input template into place
        const template = document.getElementById("lunr_search_page_template").content.cloneNode(true);
        element.innerHTML = "";
        element.appendChild(template);

        // We treat second path level as search args
        const search_args = path.split("/", 2);
        if (search_args.length > 1) {
            const args =   decodeURIComponent(search_args[1]);
            document.querySelector('div.searchform input#search').value = args;
            App.Plugins.Search.populate_results(args);
        }


    },



}