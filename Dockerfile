ARG NODE_VERSION=24

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine AS base

# Enable pnpm
RUN corepack enable pnpm

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Change ownership so the node user can write to it
RUN chown -R node:node /usr/src/app

################################################################################
# Create a stage for installing production dependencies.
FROM base AS deps

# Run as node user
USER node

# Copy package files with proper ownership
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Download dependencies
RUN pnpm install --frozen-lockfile

################################################################################
# Create a stage for building the application.
FROM deps AS build

# Copy the rest of the source files into the image.
COPY --chown=node:node . .

# Run the build script.
RUN pnpm run build

################################################################################
# Create a new stage to run the application with minimal runtime dependencies
FROM base AS final

# Use production node environment by default.
ENV NODE_ENV=production

# Pay attention to set the correct origin and port for the application.
ENV ORIGIN=https://dvoraktype.com

# Run the application as a non-root user.
USER node

# Copy the production dependencies from the deps stage and also
# the built application from the build stage into the image.
COPY --chown=node:node package.json .
COPY --from=deps --chown=node:node /usr/src/app/node_modules ./node_modules
COPY --from=build --chown=node:node /usr/src/app/dist ./dist
COPY --from=build --chown=node:node /usr/src/app/server ./server

# Expose the port that the application listens on.
EXPOSE 3000

# Run the application.
CMD ["pnpm", "run", "serve"]
