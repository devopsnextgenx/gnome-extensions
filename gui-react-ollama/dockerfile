# Stage 1: Build the application
FROM node:16-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

RUN rm -rf /etc/nginx/conf.d
COPY conf /etc/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]