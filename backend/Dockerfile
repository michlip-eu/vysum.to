FROM node:alpine as build

WORKDIR /app

COPY package.json .

RUN npm install

COPY src/ .

RUN npm run build

FROM node:alpine

WORKDIR /app

COPY package.json .

RUN npm install --omit=dev

COPY --from=build dist/ /app

ENTRYPOINT [ "node ./index.js" ]