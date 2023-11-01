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

# TODO: improve this init check
if test -f $SENTINEL_FILE; then
    log_with_color "Container already initialized!" $CYAN
else
    log_with_color "Container NOT initialized! Initializing container ..." $YELLOW

    # log_with_color "* Isolate examples" $GREEN
    cp -r /vulcan/examples/ /examples/

    # install vulcan locally
    log_with_color "* Install vulcan" $GREEN
    cd vulcan
    yarn

    # login in verdaccio registry
    log_with_color "* Login in verdaccio" $GREEN
    npx --yes npm-cli-login -u test -p 1234 -e test@domain.test -r http://verdaccio:4873

    # publish vulcan in verdaccio
    log_with_color "* Publish vulcan in verdaccio" $GREEN
    npm publish --registry http://verdaccio:4873
    npm info edge-functions --json --registry http://verdaccio:4873
    npx --yes edge-functions@latest --help http://verdaccio:4873

    cd /

    echo "OK" > "$SENTINEL_FILE"

    log_with_color "* DONE!" $GREEN
fi
