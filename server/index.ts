import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom serveStatic function with MIME type fix for production
function customServeStatic(app: express.Express) {
  // 1. Xác định đường dẫn thư mục build UI (mặc định của Vite là "dist/public")
  const staticRoot = path.join(process.cwd(), "dist/public");

  if (!fs.existsSync(staticRoot)) {
    log(`Warning: Build directory not found at ${staticRoot}, falling back to original serveStatic`);
    return serveStatic(app);
  }

  log(`Serving static files from: ${staticRoot}`);

  // 2. Serve tất cả các static file (JS, CSS, images, assets...) với MIME types đúng
  app.use(express.static(staticRoot, {
    setHeaders: (res, filePath) => {
      // Fix MIME types for all static files
      if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      } else if (filePath.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css; charset=utf-8');
      } else if (filePath.endsWith('.json')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
      } else if (filePath.endsWith('.webmanifest')) {
        res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
      } else if (filePath.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (filePath.endsWith('.svg')) {
        res.setHeader('Content-Type', 'image/svg+xml');
      } else if (filePath.endsWith('.ico')) {
        res.setHeader('Content-Type', 'image/x-icon');
      }
      
      // Security headers
      res.setHeader('X-Content-Type-Options', 'nosniff');
      // Allow iframe for android simulator, deny for others
      if (filePath.includes('android-simulator.html')) {
        res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      } else {
        res.setHeader('X-Frame-Options', 'DENY');
      }
      res.setHeader('X-XSS-Protection', '1; mode=block');
    }
  }));

  // 3. Catch-all: Chỉ trả về index.html cho HTML requests, không phải static files
  app.get("*", (req, res) => {
    // Không trả về index.html cho static files
    const ext = path.extname(req.path);
    if (ext && ext !== '.html') {
      return res.status(404).send('File not found');
    }
    
    const indexPath = path.join(staticRoot, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Application not built. Please run npm run build first.');
    }
  });
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    // Use custom serveStatic function with MIME type fix
    customServeStatic(app);
  }

  // Serve the app on port 5000 or configured PORT
  // this serves both the API and the client.
  // Port 5000 is the only port that is not firewalled on Replit.
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();