#You may need to run the command 'chmod +x buildExtension.sh' to give this script permissions to execute first!

#!/bin/bash

## Clear previous build dir
echo 'Cleaing directory'
rm -rf extensionBuild
mkdir extensionBuild

# Copy Extension manifest
cp ./extensionSrc/manifest.json ./extensionBuild/

## Copy files
# assets dir
cp -r ./extensionSrc/assets/ ./extensionBuild/assets/

# Popup html
mkdir ./extensionBuild/popup
cp ./extensionSrc/popup/popup.html ./extensionBuild/popup/

## Content script
echo 'Building content script react app'
# run create react app to build the content script
cd ./extensionSrc/contentScript/
npm run build

# Move build contents to extension folder
mv ./build ../../extensionBuild/contentScript

## Compile Sass
echo 'Compiling Sass'
# Content
sass --no-source-map ./sass/cardsContainer.scss ../../extensionBuild/contentScript/cardsContainer.css
sass --no-source-map ./sass/content.scss ../../extensionBuild/contentScript/content.css

# Popup
sass --no-source-map ../popup/popup.scss ../../extensionBuild/popup/popup.css

## Compile typescript
echo 'Compiling typescript'

# Backgroud
cd ../background/
tsc

# Popup
cd ../popup/
tsc

echo 'Done!'
