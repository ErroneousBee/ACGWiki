# ACGWiki
ACG Web Site

This is the website code and content for Ashplats Conservation Group.
It is based on the PortaWiki project.


# Some useful workflows

## Installing/upgrading node and npm

You may need to run through this if the project has become old enough to have unsupported versions of software.

* Install latest node.js from thier website
* Install nvm ( the npm version manager )
* Install npm ( the node package manager )
* Install git, the version controller.

* Git clone the ACGWiki from github:
* * `git clone git@github.com:ErroneousBee/ACGWiki.git`
* * `cd ACGWiki`
* Run `npm install` to install the dependencies.
* Run `npm run build` to build the statis website.

If packages are obsolete:

* Packages are listed in package.json
* `npm install` will download the latest 
* `npm uninstall <package-name> --save-dev` to remove an obsolete build package.
* `npm install <package-name> --save-dev` to add a new/replacement package.
* * E.g. replace old node-sass with its replacement: 
* * `npm uninstall node-sass --save-dev` then `npm install sass --save-dev`
* Then run the install and build.

## Updating content for the website

* Open VS Code
* Navigate to "content" folder. Find and open the page you are interested in.
* Run command `npm run build` and use Live Server to check your work.
* Run `npm run test` ( possibly does nothing ).
* stage and commit your changes, supply a meaningful message as to what you have done.
* If you are happy, push your changes to github.
* Let someone know to merge your changes from "main" into the "release branch"


## Publish to release branch from main branch

We have some changes pushed to branch "main" on github, and you want to publish these on the live website.

Netlify is configured to watch for commits to the "release" branch, and rebuild the website when changes are detected.

This is best done using git commands:

```
# Get into the project directory and get everything up to date
cd <path to ACGWiki>
git checkout main
git config pull.rebase false
git stash
git checkout release
git pull

# Now do the merge from main to release.
git merge main
# You may have to supply some text describing whats being merged, it is OK to be vague here.
# There should be no conflicts, if there are, resolve them and commit using VSCode.

# We could build the site locally and use VSCode Live Server to check the website looks ok
npm install 
npm run build

# Now we have it all correct locally push the updates back to github
# It should take neflify a couple of seconds to buid and publish the website
git push

# Lets also make sure we continue developing off the release branch
git checkout main
git stash pop
```

or if you know what you are doing ...

```
git checkout main; git config pull.rebase false; git stash; git checkout release; git pull; git merge main -m "Publish from main branch"; git push; git checkout main; git stash pop;
```


### Creating a thumbnails Directory


There are many tools for creating thumbnail images. I recommend using Imagemagik mogrify for conveinience:

```
# Move to the image folder you wish to thumbnail:
cd <path_to_your folder>
# Recreate a thumbs folder if necessary
rm -rf thumbs/; mkdir thumbs;
# Create/update the thumbnails
mogrify  -format jpg -path thumbs -thumbnail 200x200 *.jpg
```