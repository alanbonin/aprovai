FROM node:20-alpine
WORKDIR /app

# Copy shared package (sem deps, só JS puro)
COPY packages/shared ./packages/shared

# Copy API package manifest + source
COPY packages/api/package.json ./packages/api/package.json
COPY packages/api/src           ./packages/api/src

# Instalar dependências de produção
WORKDIR /app/packages/api
RUN npm install --omit=dev

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
