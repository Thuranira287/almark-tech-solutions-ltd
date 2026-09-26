import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3000,
    fs: {
      allow: ["./client","./index.html", "./shared"],
      deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
    },
  },
  // Strip console.* / debugger calls from the production client bundle —
  // dev builds (mode "development") keep them so local debugging still
  // works normally. This is a top-level Vite option, not a `build.*` one —
  // it was nested under `build` initially and silently had no effect,
  // caught by actually grepping the built output for console.* below.
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : undefined,
  build: {
    outDir: "dist/spa",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  plugins: [react(), expressPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
}));

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // For development use (serve mode)
    async configureServer(server) {
      // Dynamically imported here rather than at module scope: this file
      // (and everything it pulls in, including a live Prisma client) is
      // only needed for the dev middleware, and a static top-level import
      // was being evaluated even during a pure `vite build` for the client
      // bundle — which has no database and shouldn't need one.
      const { createServer } = await import("./server");
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
