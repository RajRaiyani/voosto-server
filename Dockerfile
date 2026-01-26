FROM node:24-alpine AS builder

WORKDIR /app

COPY . .

RUN npm ci
RUN npm run build 




FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

RUN npm ci --only=production && npm cache clean --force
RUN mkdir -p files tmp logs
RUN npm install -g dbmate

EXPOSE 3007

CMD ["npm", "run", "start:production"]