/*
 * WHAT IS THIS FILE?
 *
 * It's the entry point for the Express HTTP server when building for production.
 *
 * Learn more about Node.js server integrations here:
 * - https://qwik.dev/docs/deployments/node/
 *
 */
import {
  createQwikCity,
  type PlatformNode,
} from "@builder.io/qwik-city/middleware/node";
import { getRequestEvent } from "@builder.io/qwik-city";
import "dotenv/config";
import qwikCityPlan from "@qwik-city-plan";
import render from "./entry.ssr";
import express from "express";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import compression from "compression";
import { closeDb, connectionString, pingDb } from "./db";
import { runMigrations } from "./db/migrate";
import { createHealthHandler } from "./server/health";
import { clientIp, resolveOrigin } from "./server/request-rules";
import { dbErrorCode, retryWithBackoff } from "./server/retry";
import { createShutdown } from "./server/shutdown";

const headerValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

declare global {
  type QwikCityPlatform = PlatformNode;
}

// Directories where the static assets are located
const distDir = join(fileURLToPath(import.meta.url), "..", "..", "dist");
const buildDir = join(distDir, "build");
const assetsDir = join(distDir, "assets");
const migrationsDir = join(fileURLToPath(import.meta.url), "..", "..", "drizzle");

// Never fall back to the local development database in production
if (!process.env.DATABASE_URL && process.env.NODE_ENV === "production") {
  throw new Error("DATABASE_URL is required in production");
}

// Bring the database schema up to date before accepting traffic. Transient
// failures are retried 7 times with 45 s of backoff in total: the database
// still booting (each connection attempt is bounded at 10 s), a table lock
// held by live traffic (5 s per attempt), or another instance holding the
// migration lock (60 s per attempt). See src/db/migrate.ts.
await retryWithBackoff(() => runMigrations(connectionString, migrationsDir), {
  attempts: 7,
  baseMs: 1000,
  maxMs: 15_000,
  onRetry: (error, attempt, delayMs) =>
    console.warn(
      `Startup migrations failed with a transient database error (${dbErrorCode(error)}), retry ${attempt} in ${delayMs} ms`,
    ),
});

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Proxies in front of the app that append to X-Forwarded-For (Railway's edge: 1)
const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);

// Create the Qwik City Node middleware
const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  getOrigin: (req) =>
    resolveOrigin((name) => headerValue(req.headers[name]), process.env.ORIGIN),
  getClientConn: (req) => ({
    ip: clientIp(
      headerValue(req.headers["x-forwarded-for"]),
      req.socket.remoteAddress,
      TRUSTED_PROXY_HOPS,
    ),
  }),
});

// Create the express server
// https://expressjs.com/
const app = express();

// Optional request-aware diagnostics for crashes that escape request boundaries.
// This does not prevent Node from crashing, but it does provide better diagnostics for uncaught exceptions.
// See the Node documentation to handle uncaught exceptions and unhandled rejections in your app.
process.on("uncaughtExceptionMonitor", (error, origin) => {
  const requestEv = getRequestEvent();
  if (requestEv) {
    console.error("Unhandled exception during request", {
      origin,
      method: requestEv.method,
      url: requestEv.url.href,
      headersSent: requestEv.headersSent,
      error,
    });
    return;
  }

  console.error("Unhandled exception outside request", { origin, error });
});

// Liveness and readiness probe for the platform: checks the database too
app.get("/health", createHealthHandler(pingDb));

// Static asset handlers, gzip-compressed. Compression is not applied to the
// pages: it buffers output and would delay Qwik City's streamed SSR.
// https://expressjs.com/en/starter/static-files.html
app.use(
  `/build`,
  compression(),
  express.static(buildDir, { immutable: true, maxAge: "1y" }),
);
app.use(
  `/assets`,
  compression(),
  express.static(assetsDir, { immutable: true, maxAge: "1y" }),
);
app.use(express.static(distDir, { redirect: false }));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
const server = app.listen(PORT, () => {
  console.log(`Server started: http://localhost:${PORT}/`);
});

// Deploys stop containers with SIGTERM: finish in-flight requests and close
// the database pool instead of being killed mid-request
const shutdown = createShutdown({
  server,
  closeDb,
  timeoutMs: 8_000, // below docker stop's default 10 s grace period
  exit: (code) => process.exit(code),
  log: (message) => console.log(message),
});
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
