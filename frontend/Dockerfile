FROM node as build

WORKDIR /app

COPY package.json ./

RUN npm install

COPY src ./src
COPY public ./public
COPY index.html ./
COPY tsconfig.json ./
COPY tsconfig.app.json ./
COPY vite.config.ts ./
COPY tailwind.config.js ./
COPY postcss.config.js ./
COPY tsconfig.node.json ./

RUN npm run build

FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]