#!/bin/bash

build() {
    echo 'building Acetate Extension'

    export INLINE_RUNTIME_CHUNK=false
    export GENERATE_SOURCEMAP=false

    react-scripts build

    #Convert the index page into the popup
    #Can I use a rename function instead of a Mv?
    mv build/index.html build/popup.html
}

build