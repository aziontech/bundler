FROM node:24.22.3-alpine3.24@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add --no-cache linux-headers alpine-sdk python3 make g++ libc6-compat vips-dev fftw-dev libheif

RUN apk add ruby-dev

RUN gem install jekyll bundler

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY . /bundler
