# base stage to have pnpm installed
FROM node:18-alpine AS base
RUN npm i -g pnpm

# development stage
FROM base AS development
ARG APP
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install
COPY . .
RUN pnpm run build ${APP}

# production stage
#FROM base AS production
#ARG APP
#ARG NODE_ENV=production
#ENV NODE_ENV=${NODE_ENV}
#WORKDIR /usr/src/app
#COPY package.json pnpm-lock.yaml ./
#RUN pnpm install --prod
#COPY --from=development /usr/src/app/dist ./dist

# Add an env to save ARG
ENV APP_MAIN_FILE=dist/apps/${APP}/main
CMD node ${APP_MAIN_FILE}