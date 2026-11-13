# One image, two processes: the web app and the worker (choose with the command).
#   docker build -t three-digits .
#   docker run --env-file .env -p 3000:3000 three-digits                 # web
#   docker run --env-file .env three-digits npm run worker               # worker
FROM node:24-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npx next build

FROM node:24-slim AS run
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates openssl && rm -rf /var/lib/apt/lists/*
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT:-3000}"]
