import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2' };

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const target = path.resolve(root, relative);
    if (!target.startsWith(root) || relative.split('/').some(part => part.startsWith('.')) || relative.startsWith('node_modules/')) {
      res.writeHead(403).end(); return;
    }
    const info = await stat(target);
    if (!info.isFile()) { res.writeHead(404).end(); return; }
    const headers = { 'Content-Type': types[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Accept-Ranges': 'bytes' };
    let start = 0;
    let end = info.size - 1;
    const range = req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
    if (range) {
      start = Number(range[1]);
      end = range[2] ? Math.min(Number(range[2]), end) : end;
      if (start > end || start >= info.size) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }).end(); return; }
      headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`;
    }
    headers['Content-Length'] = end - start + 1;
    res.writeHead(range ? 206 : 200, headers);
    if (req.method === 'HEAD') res.end();
    else createReadStream(target, { start, end }).pipe(res);
  } catch { res.writeHead(404).end('Not found'); }
}).listen(port, '127.0.0.1', () => console.log(`The Best Home: http://127.0.0.1:${port}`));
