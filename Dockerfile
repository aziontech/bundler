FROM node:22.21.1-alpine3.23 AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add linux-headers alpine-sdk

RUN apk add ruby-dev

RUN gem install jekyll bundler

COPY . /bundler
