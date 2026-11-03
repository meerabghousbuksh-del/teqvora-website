import { handleAsNodeRequest } from "cloudflare:node";
import process from "node:process";

import config from "./config/env.js";
import database from "./config/db.js";
import createApp from "./app.js";

const { connectDatabase, disconnectDatabase } = database;

const PORT = Number(process.env.PORT || config.port || 3000);

const app = createApp();

// Start the existing Express application.
app.listen(PORT);

// Forward Cloudflare requests to Express.
function handleExpress(request) {
  return handleAsNodeRequest(PORT, request);
}

// Serialize database requests because Mongoose uses one shared connection.
let databaseQueue = Promise.resolve();

function runInDatabaseQueue(task) {
  const current = databaseQueue.then(task, task);

  databaseQueue = current.then(
    () => undefined,
    () => undefined
  );

  return current;
}

function requestNeedsDatabase(request, pathname) {
  const path = pathname.replace(/\/+$/, "") || "/";
  const method = request.method.toUpperCase();

  if (path === "/api/health") return true;

  if (path === "/api/contact" && method === "POST") {
    return true;
  }

  if (path === "/api/analytics/visit" && method === "POST") {
    return true;
  }

  return (
    path.startsWith("/api/admin/") &&
    path !== "/api/admin/login" &&
    ["GET", "PATCH", "DELETE"].includes(method)
  );
}

async function handleDatabaseRequest(request, pathname) {
  return runInDatabaseQueue(async () => {
    let connected = false;

    try {
      await connectDatabase(config.mongodbUri);
      connected = true;
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);

      if (pathname.replace(/\/+$/, "") === "/api/health") {
        return handleExpress(request);
      }

      return Response.json(
        {
          success: false,
          message:
            "The service is temporarily unavailable. Please try again shortly."
        },
        { status: 503 }
      );
    }

    try {
      return await handleExpress(request);
    } finally {
      if (connected) {
        try {
          await disconnectDatabase();
        } catch (error) {
          console.error(
            "MongoDB disconnect failed:",
            error.message
          );
        }
      }
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Your existing homepage is named teqvora.HTML.
    if (pathname === "/" && ["GET", "HEAD"].includes(request.method)) {
      const homeUrl = new URL("/teqvora.HTML", request.url);

      const assetRequest = new Request(homeUrl, {
        method: request.method,
        headers: request.headers,
        redirect: request.redirect
      });

      return env.ASSETS.fetch(assetRequest);
    }

    // Redirect /admin to the existing admin folder.
    if (pathname === "/admin") {
      return Response.redirect(
        new URL("/admin/", request.url),
        301
      );
    }

    const isApiRequest =
      pathname === "/api" || pathname.startsWith("/api/");

    // Existing HTML, CSS, JS and images.
    if (!isApiRequest) {
      return env.ASSETS.fetch(request);
    }

    // Existing Express backend APIs.
    if (requestNeedsDatabase(request, pathname)) {
      return handleDatabaseRequest(request, pathname);
    }

    return handleExpress(request);
  }
};