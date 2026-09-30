import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

function serveFile(res, filePath, fallbackHtmlPath) {
  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': stats.size,
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    } else if (fallbackHtmlPath) {
      serveFile(res, fallbackHtmlPath, null);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
}

const server = http.createServer((req, res) => {
  let reqUrl = req.url || '/';
  // Strip query parameters and anchors
  reqUrl = reqUrl.split('?')[0].split('#')[0];

  // Normalize base paths and workspace URL aliases
  const workspaceAliases = [
    '/vaishnav-workspace',
    '/vaishnavworkspace',
    '/vaishnav_workspace',
    '/vaishnavdeshmukh-portfolio'
  ];

  for (const alias of workspaceAliases) {
    if (reqUrl.startsWith(alias + '/')) {
      reqUrl = reqUrl.slice(alias.length);
      break;
    } else if (reqUrl === alias) {
      reqUrl = '/';
      break;
    }
  }

  // Clean URL for civicflow
  if (reqUrl === '/civicflow' || reqUrl === '/civicflow/') {
    return serveFile(res, path.join(__dirname, 'civicflow.html'), path.join(__dirname, 'index.html'));
  }

  // Dedicated routes for ithink sub-app
  if (reqUrl === '/ithink' || reqUrl === '/ithink/') {
    return serveFile(res, path.join(__dirname, 'ithink', 'index.html'), path.join(__dirname, 'index.html'));
  }
  if (reqUrl.startsWith('/ithink/')) {
    const subPath = reqUrl.slice('/ithink/'.length);
    const resolvedPath = path.join(__dirname, 'ithink', subPath);
    if (path.extname(resolvedPath)) {
      return serveFile(res, resolvedPath, path.join(__dirname, 'ithink', 'index.html'));
    }
    return serveFile(res, path.join(__dirname, 'ithink', 'index.html'), path.join(__dirname, 'index.html'));
  }

  // General static file lookup
  const safePath = path.normalize(reqUrl).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isDirectory()) {
      const indexFile = path.join(filePath, 'index.html');
      return serveFile(res, indexFile, path.join(__dirname, 'index.html'));
    }
    if (!err && stats.isFile()) {
      return serveFile(res, filePath, path.join(__dirname, 'index.html'));
    }
    // Fallback to root index.html
    serveFile(res, path.join(__dirname, 'index.html'), null);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
