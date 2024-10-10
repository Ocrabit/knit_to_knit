# Use an official Node.js image.
FROM node:18-alpine AS developer

# Set working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock if you are using Yarn)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's code
COPY . .

# Expose the port Vite runs on (default is 5173)
EXPOSE 5173 8097

# Set environment variables for hot-reloading in Docker
ENV CHOKIDAR_USEPOLLING=true

# Start Vite in development mode (hot-reloading)
CMD ["npm", "run", "dev"]