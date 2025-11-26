# Builder stage - builds React for production
FROM node:18-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Developer stage - for hot-reloading
FROM node:18-alpine AS developer

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 5173
ENV CHOKIDAR_USEPOLLING=true

CMD ["npm", "run", "dev"]