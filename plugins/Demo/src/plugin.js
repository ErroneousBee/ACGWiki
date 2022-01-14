App.Plugins.Demo = {

    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {
        console.log("Initialise Demo plugin");
        // This would be a good place to add an icon to the toolbar.
    },

    /**
     * Executed when the markdown page is read and converted. 
     * We will have to render the content os the article here.
     * @param {Object} json - Frontmatter object, pulled from the markdown file.
     * @param {String} html - The markdown after its been converted to html.
     * @param {HTMLElement} element - The article element that any content should be inserted into.
     */
    async onpageload(json, html, element) {
        console.log("Demo plugin page load");

        // All we are doing here is fiddling with the html.
        element.innerHTML = '<div class="Demo_enhance">' + html + '</div>';
    }
}