import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

const staticOptions = {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.glb')) {
      res.setHeader('Content-Type', 'model/gltf-binary');
    }
  }
};

// Mount static handler for both base paths
app.use('/vaishnavdeshmukh-portfolio', express.static(__dirname, staticOptions));
app.use(express.static(__dirname, staticOptions));

// Clean URL for civicflow
app.get('/civicflow', (req, res) => {
  res.sendFile(path.join(__dirname, 'civicflow.html'));
});

// Dedicated routes for ithink sub-app
app.get(['/ithink', '/ithink/*', '/vaishnavdeshmukh-portfolio/ithink', '/vaishnavdeshmukh-portfolio/ithink/*'], (req, res, next) => {
  if (req.path.includes('.') && !req.path.endsWith('.html')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'ithink', 'index.html'));
});

// Root fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
