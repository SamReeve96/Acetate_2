#You may need to run the command 'chmod +x buildExtension.sh' to give this script permissions to execute first!

os=${OSTYPE//[0-9.-]*/}

case "$os" in
    darwin)
    echo "Running on MacOS"
    ;;

    msys)
    echo "Running on Windows using git bash"
    ;;

    linux)
    echo "Running on Linux"
    ;;
    *)

    echo "Unknown Operating system $OSTYPE"
    exit 1
esac

# Get necessary npm stuffs
echo 'Getting NPM modules'
cd ./extensionSrc/reactComponents
npm i
cd ../nonReactComponents
# npm i
cd ../../

echo 'Installing Sass Globally'
npm install -g sass

#Round two one day....https://github.com/Microsoft/TypeScript/issues/6387
echo 'Installing typescript Globally'
npm i -g typescript

## Clear previous build dir
echo 'Cleaing directory...'
rm -rf extensionBuild
mkdir extensionBuild
echo 'Done!'

## Content script
echo 'Building content script react app...'

## Add linter command here
## If it fails it should halt - https://stackoverflow.com/questions/40146746/how-to-make-batch-file-stop-when-command-fails

# run create react app to build the content script
cd ./extensionSrc/reactComponents

case "$os" in
darwin)
    npm run build
    ;;
linux)
    npm run build
    ;;
msys)
    npm run winBuild
    ;;
esac

# Move build contents to extension folder
mv ./build ../../extensionBuild/contentScript
echo 'Done!'

## Compile Sass
echo 'Compiling Sass...'
# Content
sass --no-source-map ./sass/cardsContainer.scss ../../extensionBuild/contentScript/cardsContainer.css
sass --no-source-map ./sass/content.scss ../../extensionBuild/contentScript/content.css

# Popup
sass --no-source-map ../nonReactComponents/popup/popup.scss ../../extensionBuild/popup/popup.css
echo 'Done!'

## Compile typescript
echo 'Compiling typescript...'

cd ../nonReactComponents/
tsc

## Copy files
cd ../..

# Copy Extension manifest
echo 'Copying Extension Manifest and Assets...'
cp ./extensionSrc/manifest.json ./extensionBuild/

# assets dir
cp -r ./extensionSrc/assets/ ./extensionBuild/assets/
echo 'Done!'

# Popup html
echo 'Copying Popup Html...'
# mkdir ./extensionBuild/popup
cp ./extensionSrc/nonReactComponents/popup/popup.html ./extensionBuild/popup/
echo 'Done!'

# options html
echo 'Copying options Html...'
cp ./extensionSrc/nonReactComponents/options/options.html ./extensionBuild/options/
echo 'Done!'

echo 'build complete!'