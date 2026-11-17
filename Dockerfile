# Docker Hardened Image, runtime variant: no shell, no package manager, default user 1000.
# Pull requires `docker login dhi.io`.
FROM dhi.io/node:22-alpine3.24

ENV NODE_ENV=production
WORKDIR /app

# Copy built client (already built in CI)
COPY deploy/client/dist ./static

# Copy built & deployed server (already built in CI)
COPY deploy/server/dist ./dist
# Group 0 write access: OpenShift runs the pod with an arbitrary UID in group 0.
COPY --chown=1000:0 --chmod=775 deploy/server/db ./db
COPY deploy/server/node_modules ./node_modules
COPY deploy/server/package.json ./package.json

USER 1000

EXPOSE 3000

CMD ["node", "./dist/index.js"]
