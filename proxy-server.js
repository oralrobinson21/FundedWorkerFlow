const http = require('http');
const net = require('net');
const fs = require('fs');
const path = require('path');

const PROXY_PORT = 8081;
const BACKEND_PORT = 5000;
const EXPO_PORT = 19006;
const WEB_DIST_DIR = path.join(__dirname, 'web-dist');

console.log('Starting CityTasks Proxy Server...');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function serveWebApp(req, res) {
  let urlPath = req.url.split('?')[0];
  
  if (urlPath === '/' || urlPath === '') {
    urlPath = '/index.html';
  }
  
  const filePath = path.join(WEB_DIST_DIR, urlPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveStaticFile(res, filePath);
  } else {
    serveStaticFile(res, path.join(WEB_DIST_DIR, 'index.html'));
  }
}

function proxyToBackend(req, res) {
  const options = {
    hostname: 'localhost',
    port: BACKEND_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${BACKEND_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Backend proxy error for ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end(`Backend Error: ${err.message}`);
    }
  });

  req.pipe(proxyReq);
}

function proxyToExpo(req, res) {
  const options = {
    hostname: 'localhost',
    port: EXPO_PORT,
    path: req.url,
    method: req.method,
    headers: {
      ...req.headers,
      host: `localhost:${EXPO_PORT}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Expo proxy error for ${req.url}:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502);
      res.end(`Expo Error: ${err.message}`);
    }
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const isApiRequest = req.url.startsWith('/api');
  const isExpoRequest = req.url.startsWith('/ios/') || 
                        req.url.startsWith('/android/') ||
                        req.url.includes('manifest.json') ||
                        req.headers['expo-platform'];
  
  if (isApiRequest) {
    proxyToBackend(req, res);
  } else if (isExpoRequest) {
    proxyToExpo(req, res);
  } else {
    serveWebApp(req, res);
  }
});

server.on('upgrade', (req, socket, head) => {
  const targetSocket = net.connect(EXPO_PORT, 'localhost', () => {
    const upgradeReq = `${req.method} ${req.url} HTTP/1.1\r\n` +
      Object.entries(req.headers)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\r\n') +
      '\r\n\r\n';
    
    targetSocket.write(upgradeReq);
    if (head && head.length) {
      targetSocket.write(head);
    }
    
    socket.pipe(targetSocket);
    targetSocket.pipe(socket);
  });
  
  targetSocket.on('error', (err) => {
    console.error('WebSocket proxy error:', err.message);
    socket.end();
  });
  
  socket.on('error', (err) => {
    console.error('Client socket error:', err.message);
    targetSocket.end();
  });
});

server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Proxy running on http://0.0.0.0:${PROXY_PORT}`);
  console.log(`  /api/* -> localhost:${BACKEND_PORT} (Backend)`);
  console.log(`  /ios/*, /android/* -> localhost:${EXPO_PORT} (Expo Go)`);
  console.log(`  /* -> Static web app from web-dist/`);
});
