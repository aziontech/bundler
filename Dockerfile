FROM node:18.20.5-alpine3.21 AS node

WORKDIR /

RUN apk upgrade --no-cache --update 

RUN apk add linux-headers alpine-sdk

RUN apk add ruby-dev

RUN gem install jekyll bundler

COPY . /bundler
