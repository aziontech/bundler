#!/bin/bash

docker-compose up -d && \
    sleep 3 && \
    docker-compose exec test sh /vulcan/tests/scripts/setup-e2e-env.sh