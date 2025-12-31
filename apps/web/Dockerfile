FROM oven/bun:1.3.5 AS build
WORKDIR /app
COPY . .
RUN bun install
WORKDIR /app/apps/web
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
