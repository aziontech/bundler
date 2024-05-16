
FROM node:18-alpine3.17 AS node

RUN apk upgrade --no-cache --update 

RUN apk add linux-headers alpine-sdk

RUN apk add ruby-dev

RUN gem install jekyll bundler

COPY . .
