const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 7788;
const ROOT = __dirname;

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'text/plain' });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname;

  // CORS for local use
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (pathname === '/api/films') {
    const filmsDir = path.join(ROOT, 'films');
    if (!fs.existsSync(filmsDir)) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end('[]');
    }
    const films = fs.readdirSync(filmsDir).filter(f => 
      fs.statSync(path.join(filmsDir, f)).isDirectory()
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(films));
  }

  if (pathname === '/') pathname = '/public/preview.html';
  if (pathname.startsWith('/films/')) {
    pathname = pathname; // already correct relative to ROOT
  } else if (!pathname.startsWith('/public/')) {
    pathname = '/public' + pathname;
  }

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  serveFile(res, filePath);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Simple VideoHub running at http://127.0.0.1:${PORT}`);
});
