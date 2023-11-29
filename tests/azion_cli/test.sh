#!/bin/bash

sudo apt-get install expect -y

function verify_output() {
    echo "--------------------------------------"
    echo "------- Check status code ------------"
    echo "--------------------------------------"
    local exit_code=$?
    if [ "$exit_code" -ne 0 ]; then
        echo "The command failed or the command output does not match the expected output"
        echo "Output code: $exit_code"
        exit 1
    fi
}

latest_tag=$(
    git ls-remote --tags https://github.com/aziontech/azion \
    | grep -v -- '-dev' \
    | grep -v -- '-beta' \
    | sort -t '/' -k 3 -V \
    | tail -n1 \
    | sed 's/.*\///; s/\^{}//'
)
echo "--------------------------------------"
echo "-- The most recent tag: $latest_tag --"
echo "--------------------------------------"
verify_output

# binary download
latest_tag_uri="https://downloads.azion.com/linux/x86_64/azion-$latest_tag"
curl -o azioncli $latest_tag_uri
chmod 777 ./azion

# creating apps directory 
sudo mkdir -p /opt/apps/

# move binary 
sudo rm -rf /opt/apps/azion
sudo mv ./azion /opt/apps/

# create symbolic link
sudo rm /usr/local/bin/azion
sudo ln -s /opt/apps/azion /usr/local/bin/azion

azion version
verify_output

export USERNAME=$USERNAME
export PASSWORD=$PASSWORD
azion login --username $USERNAME --password $PASSWORD
verify_output

rm -rf vulcan
rm -rf node-pages-12-3-1

git clone https://github.com/aziontech/vulcan.git
cp -r vulcan/examples/next/node-pages-12-3-1 ./ 
cp -r link.exp ./node-pages-12-3-1
cd node-pages-12-3-1

expect link.exp
verify_output

yarn install

azion build
verify_output
