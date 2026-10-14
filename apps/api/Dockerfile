FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/package.json
COPY apps/api/package.json apps/api/package.json
COPY scripts/package.json scripts/package.json
RUN pnpm install --filter @openpaper/api --filter @openpaper/shared
COPY tsconfig.base.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @openpaper/shared build && pnpm --filter @openpaper/api build
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]
