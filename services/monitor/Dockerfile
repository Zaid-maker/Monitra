FROM oven/bun:1.3.5-slim AS base
WORKDIR /app
COPY . .
RUN bun install
WORKDIR /app/services/monitor
RUN bun build ./src/index.ts --outdir ./dist
EXPOSE 3002
CMD ["bun", "dist/index.js"]
