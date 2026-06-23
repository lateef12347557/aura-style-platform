import serverModule from '../dist/server/server.js';

function nodeRequestToWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['host'];
  const url = `${protocol}://${host}${req.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v != null) headers.append(k, Array.isArray(v) ? v.join(',') : String(v));
  }

  const bodyChunks = [];
  return new Promise((resolve, reject) => {
    req.on('data', (chunk) => bodyChunks.push(chunk));
    req.on('end', () => {
      const body = bodyChunks.length ? Buffer.concat(bodyChunks) : undefined;
      try {
        const request = new Request(url, {
          method: req.method,
          headers,
          body,
        });
        resolve(request);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  try {
    const request = await nodeRequestToWebRequest(req);
    const env = process.env;
    const response = await serverModule.fetch(request, env, undefined);

    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    const buffer = Buffer.from(await response.arrayBuffer());
    res.end(buffer);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end('<h1>Server error</h1>');
  }
}
