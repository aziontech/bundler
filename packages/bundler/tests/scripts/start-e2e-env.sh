#!/bin/bash

docker-compose up -d && \
    sleep 3 && \
    docker-compose exec -T test sh /bundler/tests/scripts/setup-e2e-env.sh