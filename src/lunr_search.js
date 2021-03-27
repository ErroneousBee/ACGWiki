const Search = {

    keyup(e) {


        const value = e.target.value;
        const results = Search.index.search(value);

        if (value === "" || results.length === 0) {
            document.querySelector("div.searchresults").innerHTML = '<hr/>';
            return;
        }

        let html = '<ul>';
        for (const result of results.slice(0, 10)) {

            const preview = Search.previews[result.ref];

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
     * Set focus on input if its us
     */
    pageloaded() {
        const input = document.querySelector("article div.searchform input#search");
        if (input) {
            input.focus();
        }
    }

};

/* global lunr LUNR_DATA LUNR_PREVIEW_LOOKUP */
Search.index = lunr.Index.load(LUNR_DATA);
Search.previews = LUNR_PREVIEW_LOOKUP;

// Listen for page loads
document.addEventListener("pathloaded", Search.pageloaded, false);