#!/bin/bash

# color codes
RED=31
GREEN=32
YELLOW=33
BLUE=34
MAGENTA=35
CYAN=36
DEFAULT=0

log_with_color() {
    local message="$1"
    local color_code="$2"
    echo -e "\e[${color_code}m${message}\e[0m"
}

#  isolate examples
log_with_color "* STARTING ..." $GREEN

SENTINEL_FILE="/vulcan/.initialized.keep"

# create vulcan temp to install in verdaccio
create_vulcan_temp() {
    local target="$1"
    local folder="$2"
    rm -rf $folder
    mkdir -p $folder
    cd /$target
    tar cf - --exclude='.git' --exclude='node_modules' . | (cd ../$folder && tar xvf -) > /dev/null 2>&1
    cd /
}

# TODO: improve this init check
if test -f $SENTINEL_FILE; then
    log_with_color "Container already initialized!" $CYAN
    log_with_color "* Vulcan version:" $GREEN
    npx --yes --registry=http://verdaccio:4873 edge-functions@latest --version
else
    log_with_color "Container NOT initialized! Initializing container ..." $YELLOW

    # log_with_color "* Isolate examples" $GREEN
    cp -r /vulcan/examples/examples /examples/

    # create vulcan temp to install
    VULCAN_TEMP=vulcan-temp
    create_vulcan_temp /vulcan $VULCAN_TEMP

    # install vulcan temp locally
    log_with_color "* Install vulcan" $GREEN
    cd /$VULCAN_TEMP
    yarn

    # login in verdaccio registry
    log_with_color "* Login in verdaccio" $GREEN
    npx --yes npm-cli-login -u test -p 1234 -e test@domain.test -r http://verdaccio:4873

    # publish vulcan in verdaccio
    log_with_color "* Publish vulcan in verdaccio" $GREEN
    npm publish --registry http://verdaccio:4873
    npm info edge-functions --json --registry http://verdaccio:4873
    log_with_color "* Vulcan version:" $GREEN
    npx --yes --registry=http://verdaccio:4873 edge-functions@latest --version

    cd /

    echo "OK" > "$SENTINEL_FILE"

    log_with_color "* DONE!" $GREEN
fi
