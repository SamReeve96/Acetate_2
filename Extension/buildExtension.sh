#You may need to run the command 'chmod +x buildExtension.sh' to give this script permissions to execute first!

#!/bin/bash

## Clear previous build dir
echo 'Cleaing directory...'
rm -rf extensionBuild
mkdir extensionBuild
echo 'Done!'

# Copy Extension manifest
echo 'Copying Extension Manifest and Assets...'
cp ./extensionSrc/manifest.json ./extensionBuild/

## Copy files
# assets dir
cp -r ./extensionSrc/assets/ ./extensionBuild/assets/
echo 'Done!'

# Popup html
echo 'Copying Popup Html...'
mkdir ./extensionBuild/popup
cp ./extensionSrc/popup/popup.html ./extensionBuild/popup/
echo 'Done!'

## Content script
echo 'Building content script react app...'

## Add linter command here
## If it fails it should halt - https://stackoverflow.com/questions/40146746/how-to-make-batch-file-stop-when-command-fails

# run create react app to build the content script
cd ./extensionSrc/contentScript/
npm run build

# Move build contents to extension folder
mv ./build ../../extensionBuild/contentScript
echo 'Done!'

## Compile Sass
echo 'Compiling Sass...'
# Content
sass --no-source-map ./sass/cardsContainer.scss ../../extensionBuild/contentScript/cardsContainer.css
sass --no-source-map ./sass/content.scss ../../extensionBuild/contentScript/content.css

# Popup
sass --no-source-map ../popup/popup.scss ../../extensionBuild/popup/popup.css
echo 'Done!'

## Compile typescript
echo 'Compiling typescript...'

# Backgroud
cd ../background/
tsc

# Popup
cd ../popup/
tsc

echo 'Done!'
