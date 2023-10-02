FROM node:16-slim
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . .
CMD node --no-experimental-fetch App.js
EXPOSE 8080
