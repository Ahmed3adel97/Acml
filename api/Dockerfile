FROM node:8.7.0-alpine

RUN apk update && apk add bash

RUN apk add \
    python \
    make \
    g++ \
    && npm install \
    node-gyp -g

    WORKDIR /api