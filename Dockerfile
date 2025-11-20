FROM node:25-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NODE_ENV=production

RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg /usr/local/bin/pnpm /usr/local/bin/pnpx && \
    npm install -g corepack && \
    corepack enable

WORKDIR /app

COPY pnpm-lock.yaml package.json /app/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY . /app/

RUN pnpm type:check

CMD ["sh", "-c", "pnpm db:push && pnpm start"]