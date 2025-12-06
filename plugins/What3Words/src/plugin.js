App.Plugins.What3Words = {

    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {
        // console.log("Initialise What3Words plugin");

        showdown.extension('what3words', function () {
            return [
                {
                    type: 'lang',
                    regex: /\/\/\/([\w]+\.[\w]+\.[\w]+)(\b)/g,
                    replace: '<a href="https://w3w.co/$1">///$1</a>$2'
                }
            ];
        });
    },

    /**
     * Executed when the markdown page has been read and converted to HTML.
     * Useful for reworking the HTML, building extras into the page, etc.
     * @param {Object} json - Frontmatter object, pulled from the markdown file.
     * @param {String} html - The markdown after its been converted to html.
     * @param {HTMLElement} element - The article element that any content should be inserted into.
     */
    async onpageload(json, html, element) {

        // We could prprocess the w3w links to make a hover effect showing the map in a popover.
    }
}