FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3001

EXPOSE 3001

CMD ["node", "dist/server.js"]

_656441adfeb96c87959311e1507c1153.node-api.songjaehyun.com.

_7c4b40059631fc957eaf94c7db84076d.jkddzztszm.acm-validations.aws.