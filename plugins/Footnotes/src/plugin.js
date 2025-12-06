App.Plugins.Footnotes = {

    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {
        showdown.extension('footnotes', function () {
            return [

                // Reference target on its own line 
                // [^1]: Some explanatory text here
                {
                    type: 'lang',
                    regex: /\[\^([\d\w]+)\]:\s?(.*)/g,
                    replace: '<div class="footnote" id="popover-$1" popover>[$1]: $2 </div>'
                },

                // In text note [^1] or [^yourtext]
                {
                    type: 'lang',
                    // filter: function (text, converter, options) {
                    //     console.log('xxx',text);
                    //     return text;
                    // },
                    regex: /\[\^([\d\w]+)\]([^:])/g,
                    replace: '<sup class="footnote" popovertarget="popover-$1" onclick="document.getElementById(this.getAttribute(\'popovertarget\')).showPopover();">[$1]</sup>$2'
                }
            ];
        });

    },

    /**
     * Executed when the markdown page is read and converted. 
     * We will have to render the content os the article here.
     * @param {Object} json - Frontmatter object, pulled from the markdown file.
     * @param {String} html - The markdown after its been converted to html.
     * @param {HTMLElement} element - The article element that any content should be inserted into.
     */
    async onpageload(json, html, element) {

        // TODO: Build a table of all the notes

        // All we are doing here is fiddling with the html.
        //element.innerHTML = '<div class="Demo_enhance">' + html + '</div>';
    }
}