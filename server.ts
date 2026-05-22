import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  // Set the port from environment variables or fallback to 3000
  const PORT = process.env.PORT || 3000;

  // Security & Optimization headers
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Disable server header information for security
    res.removeHeader("X-Powered-By");
    next();
  });

  // Simple Health Check endpoint for monitoring & deployment verification
  app.get("/api/health", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.status(200).json({
      status: "healthy",
      service: "ALGS Live Server",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version
    });
  });

  // Serve static assets or use Vite dev middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode with active Vite HMR...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode with optimized static assets serving...");
    const distPath = path.resolve(__dirname, "dist");
    
    // Serve static files from 'dist' directory with cache-control optimization
    app.use(express.static(distPath, {
      maxAge: "1d",
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          // Do not cache html files to prevent stale user-cached versions
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        } else if (filePath.match(/\.(js|css|webp|png|jpg|jpeg|svg|woff|woff2)$/)) {
          // Aggressive cache for compiled assets with hash
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        }
      }
    }));

    // Fallback all secondary requests to index.html for react routes
    app.get("*", (req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server successfully started. Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Critical error during server initialization:", error);
  process.exit(1);
});
