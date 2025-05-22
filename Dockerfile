FROM node:22.1.0-alpine

ENV NODE_ENV=production
WORKDIR /app

# Copy built client (already built in CI)
COPY deploy/client/dist ./static

# Copy built & deployed server (already built in CI)
COPY deploy/server/dist ./dist
COPY deploy/server/db ./db
COPY deploy/server/node_modules ./node_modules
COPY deploy/server/package.json ./package.json

EXPOSE 3000

CMD ["node", "./dist/index.js"]
