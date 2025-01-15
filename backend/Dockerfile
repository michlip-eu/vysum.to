FROM node:alpine as build

WORKDIR /app

COPY backend/package.json ./
COPY backend/tsconfig.json ./

RUN npm install

COPY backend/src/ ./

RUN npm run build

FROM node:alpine

WORKDIR /app

COPY backend/package.json .

RUN npm install --omit=dev

COPY --from=build /app/dist/ /app

ENTRYPOINT [ "node ./index.js" ]