FROM node:20-alpine AS deps
WORKDIR /ws

RUN npm install -g @nestjs/cli@latest

COPY package*.json ./
RUN npm install --legacy-peer-deps --prefer-offline

FROM node:20-alpine AS builder
WORKDIR /ws
COPY --from=deps /ws/node_modules ./node_modules
COPY . . 
RUN npm install -g @nestjs/cli
RUN npm run build

FROM node:20-alpine
WORKDIR /ws
COPY --from=builder /ws/dist ./dist
COPY --from=builder /ws/node_modules ./node_modules
COPY package*.json ./

RUN npm install --omit=dev --prefer-offline

EXPOSE 7000
CMD ["node", "dist/main.js"]
