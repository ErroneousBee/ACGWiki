# ACGWiki
ACG Web Site

This is the website code and content for Ashplats Conservation Group.
It is based on the PortaWiki project.


# Some useful workflows

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
git pull
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
```