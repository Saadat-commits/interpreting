# Produktions-Image (Node-Server). Daten liegen im Volume /app/data.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/app/data PORT=3000
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/assets ./assets
COPY --from=build /app/next.config.ts ./
VOLUME ["/app/data"]
EXPOSE 3000
CMD ["npx", "next", "start"]
