import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

const configDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(configDir, "../..");
const fixtureRunDir = resolve(repoRoot, "outputs/fixture-run");

function serveFixtureRunArtifacts(): Plugin {
  return {
    name: "serve-fixture-run-artifacts",
    configureServer(server) {
      server.middlewares.use(serveRunArtifact);
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveRunArtifact);
    },
  };
}

function serveRunArtifact(request: IncomingMessage, response: ServerResponse, next: () => void): void {
  const path = request.url?.split("?")[0];
  if (path !== "/run.json" && path !== "/ndvi-difference.json") {
    next();
    return;
  }
  const filePath = resolve(fixtureRunDir, path.slice(1));
  if (!existsSync(filePath)) {
    response.statusCode = 404;
    response.end("Not found");
    return;
  }
  response.setHeader("Content-Type", "application/json");
  response.end(readFileSync(filePath));
}

export default defineConfig({
  plugins: [react(), serveFixtureRunArtifacts()],
  worker: { format: "es" },
  server: {
    port: 5173,
    fs: {
      allow: [repoRoot],
    },
  },
});
