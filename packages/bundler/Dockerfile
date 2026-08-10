FROM node:22.21.1-alpine3.23@sha256:0340fa682d72068edf603c305bfbc10e23219fb0e40df58d9ea4d6f33a9798bf AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add --no-cache linux-headers alpine-sdk python3 make g++ libc6-compat vips-dev fftw-dev libheif

RUN apk add ruby-dev

RUN gem install jekyll bundler

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY . /bundler
