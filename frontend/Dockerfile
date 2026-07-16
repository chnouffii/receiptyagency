FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
RUN npm install ajv@8.17.1 ajv-keywords@5.1.0 --legacy-peer-deps
COPY . .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
