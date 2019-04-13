FROM node:11.8

ADD package.json /app/
WORKDIR /app/

RUN npm install

ADD . /app/