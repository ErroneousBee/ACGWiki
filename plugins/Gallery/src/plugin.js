App.Plugins.Gallery = {

    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {
        // Nothing to initialise!
    },

    /**
     * Executed when the markdown page is read and converted. 
     * We will have to render the content os the article here.
     * @param {Object} json - Frontmatter object, pulled from the markdown file.
     * @param {String} html - The markdown after its been converted to html.
     * @param {HTMLElement} element - The article element that any content should be inserted into.
     */
    async onpageload(json, html, element, source) {


        // Widen the article
        document.getElementById("content").classList.add("wide");

        // Load HTML into a page and fiddle with it.
        const template = document.createElement('template');
        template.innerHTML = html;
        const page = template.content;

        const pageURL = new URL(source);
        const path = pageURL.pathname.substring(0, pageURL.pathname.lastIndexOf("/"));

        // Create the preamble/intro container
        const preamble = document.createElement('div');
        preamble.className = "Gallery_preamble";

        // Anything before the first image is page preamble
        let eohead = page.querySelector("img");
        while (eohead?.parentElement) {
            eohead = eohead.parentElement;
        }
        while (eohead?.previousElementSibling) {
            preamble.prepend(eohead.previousElementSibling.cloneNode(true));
            eohead = eohead.previousElementSibling;
        }

        // Create the grid container
        const grid = document.createElement('div');
        grid.className = "Gallery";

        // Pull all the images from the grid
        for (const img of page.querySelectorAll("img")) {
            const file = img.getAttribute("src");
            img.setAttribute("src", path + '/' + file);

            // Get some caption text from trailing text, or title, or alt text
            let text;
            if (img.nextSibling) {
                text = img.nextSibling.textContent.trim();
            }

            const figure = document.createElement('figure');
            const caption = document.createElement('figcaption');
            caption.innerText = img.getAttribute("title") || img.getAttribute("alt");
            figure.append(caption);
            figure.append(img);
            const p = document.createElement('p');
            p.innerText = text;
            figure.append(p);

            grid.append(figure);

        }

        // TODO: Make some way of setting article width only for this plugin
        // element.style.maxWidth = "100%";

        // TODO: Find a way of keeping header texts

        // Show it!
        element.textContent = '';
        element.appendChild(preamble);
        element.appendChild(grid);

        element.querySelectorAll("img").forEach(image => {
            image.onclick = this.open_image.bind(this, element);
        });

    },

    /**
     * View an image in a container overlay that dismisses when clicked
     * @param {element} article_el 
     * @param {event} event 
     */
    open_image(article_el, event) {

        const show = document.createElement('div');
        show.className = "Gallery_show";
        show.onclick = () => show.remove();

        const image = document.createElement('img');
        image.src = event.target.src;
        show.appendChild(image);


        article_el.appendChild(show);


    }
}