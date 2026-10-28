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
import { connectionString } from "./db";
import { runMigrations } from "./db/migrate";
import { clientIp, resolveOrigin } from "./server/request-rules";

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

// Bring the database schema up to date before accepting traffic
await runMigrations(connectionString, migrationsDir);

// Allow for dynamic port
const PORT = process.env.PORT ?? 3000;

// Create the Qwik City Node middleware
const { router, notFound } = createQwikCity({
  render,
  qwikCityPlan,
  getOrigin: (req) =>
    resolveOrigin((name) => headerValue(req.headers[name]), process.env.ORIGIN),
  getClientConn: (req) => ({
    ip: clientIp(headerValue(req.headers["x-forwarded-for"]), req.socket.remoteAddress),
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

// Enable gzip compression
// app.use(compression());

// Static asset handlers
// https://expressjs.com/en/starter/static-files.html
app.use(`/build`, express.static(buildDir, { immutable: true, maxAge: "1y" }));
app.use(
  `/assets`,
  express.static(assetsDir, { immutable: true, maxAge: "1y" }),
);
app.use(express.static(distDir, { redirect: false }));

// Use Qwik City's page and endpoint request handler
app.use(router);

// Use Qwik City's 404 handler
app.use(notFound);

// Start the express server
app.listen(PORT, () => {
   
  console.log(`Server started: http://localhost:${PORT}/`);
});
