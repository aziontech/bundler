FROM node:22.23.4-alpine3.24@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914 AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add --no-cache linux-headers alpine-sdk python3 make g++ libc6-compat vips-dev fftw-dev libheif

RUN apk add ruby-dev

RUN gem install jekyll bundler

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY . /bundler
