FROM node:21.6.0-alpine3.18 AS development
WORKDIR /presale-api
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build




FROM node:21.6.0-alpine3.18 AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /presale-api
COPY package*.json ./

RUN npm install --only=prod
COPY . .
COPY --from=development /presale-api/dist/src ./dist/src

CMD [ "node", "dist/src/main" ]