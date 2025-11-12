FROM node:23-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json /app/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY . /app/

RUN pnpm type:check && pnpm db:push

CMD ["pnpm", "start"]