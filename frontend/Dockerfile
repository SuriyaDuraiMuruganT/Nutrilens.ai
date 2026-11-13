FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Accept backend URL as a build arg (e.g. https://nutrilens-backend.up.railway.app)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ---- Production nginx stage ----
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# At container startup, substitute the placeholder with the real backend URL
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

EXPOSE 80
CMD ["/bin/sh", "-c", \
  "sed -i \"s|BACKEND_URL_PLACEHOLDER|${VITE_API_URL}|g\" /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
