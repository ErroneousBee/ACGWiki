App.Plugins.Gallery = {

    /**
     * Executed when config is read and it sees the plugin is to be loaded.
     */
    async initialise() {
        // Nothing to initialise!
    },

    /**
     * Executed when the markdown page is read and converted. 
     * We will have to render the content of the article here.
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

        // Pull all the images from the converted markdown and construct 
        // a figure for each one.
        for (const img of page.querySelectorAll("img")) {

            console.log('xxx', img, img.nextSibling );

            // Get the caption before we move the element about.
            const below_text = (img.nextSibling) ? img.nextSibling.nodeValue.trim() : '';

            // We need the image path and its thumbnail path
            const file = img.getAttribute("src");
            const fn = file.split('/').at(-1);
            const dn = file.split('/').slice(0,-1).join("/");
            img.setAttribute("src", path + '/' + dn + '/thumbs/' + fn);
            img.setAttribute("data-src", path + '/' + file);

            const figure = document.createElement('figure');
            const caption = document.createElement('figcaption');
            caption.innerText = img.getAttribute("alt") ||  img.getAttribute("title") || fn ;
            figure.append(caption);
            figure.append(img);

            // Add fuller text below the image.
            const p = document.createElement('p');
            p.innerText = below_text;
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
        image.src = event.target.getAttribute('data-src');
        show.appendChild(image);

        article_el.appendChild(show);

    }
}