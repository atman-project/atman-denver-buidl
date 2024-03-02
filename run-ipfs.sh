#!/bin/bash

set -euxo pipefail

mkdir -p ipfs-datadir/staging
mkdir -p ipfs-datadir/data

docker run -d --name ipfs_host -v $PWD/ipfs-datadir/staging:/export -v $PWD/ipfs-datadir/data:/data/ipfs -p 4001:4001 -p 4001:4001/udp -p 127.0.0.1:8080:8080 -p 127.0.0.1:5001:5001 ipfs/kubo:latest

sleep 3

docker exec ipfs_host ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:3000","http://localhost:3001"]'
docker exec ipfs_host ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "GET", "POST"]'

docker restart ipfs_host
docker logs -f ipfs_host

os_name=$(uname)
if [[ "$os_name" == "Darwin" ]]; then
  open http://localhost:5001/webui
elif [[ "$os_name" == "Linux" ]]; then
  xdg-open http://localhost:5001/webui
else
    echo "Unknown OS: $os_name"
fi
