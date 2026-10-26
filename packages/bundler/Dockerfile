FROM node:22.23.2-alpine3.24@sha256:b6f26b36c8ff49624cfdac716b8ea1138d606df02586a77d364bb5536a634f85 AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add --no-cache linux-headers alpine-sdk python3 make g++ libc6-compat vips-dev fftw-dev libheif

RUN apk add ruby-dev

RUN gem install jekyll bundler

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY . /bundler
