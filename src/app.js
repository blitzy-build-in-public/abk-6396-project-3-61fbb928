import { createServer } from 'node:http';

/**
 * Builds the HTTP application and returns its server without starting it.
 *
 * The returned server is not listening: the caller owns listen() and close(),
 * so a test can run the real routing table on a free port rather than the
 * tutorial's.
 *
 * @returns {import('node:http').Server} a configured server that has not been
 * started
 */
export function createApp() {
  return createServer((req, res) => {
    // req.url holds the request-target ('/hello?name=world'), so only its
    // pathname is compared. The 'http://localhost' argument is only a base,
    // needed because parsing a relative request-target requires one, and its
    // host is never used. A target the URL parser rejects, such as the
    // 'GET //' request line, has no pathname to match, so it falls to the 404
    // branch like any other unknown path.
    const pathname = URL.canParse(req.url, 'http://localhost')
      ? new URL(req.url, 'http://localhost').pathname
      : undefined;

    if (pathname !== '/hello') {
      sendText(res, 404, 'Not Found');
    } else if (req.method !== 'GET') {
      sendText(res, 405, 'Method Not Allowed', { Allow: 'GET' });
    } else {
      sendText(res, 200, 'Hello world');
    }
  });
}

// sendText(res, statusCode, body, extraHeaders): sets the plain-text headers
// and status on res, then ends the response with body.
function sendText(res, statusCode, body, extraHeaders = {}) {
  // text/plain assumes US-ASCII, so the UTF-8 body needs its charset stated
  // explicitly.
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');

  // Sending the byte length frames the response by length instead of as a
  // chunked stream.
  res.setHeader('Content-Length', Buffer.byteLength(body));

  for (const [name, value] of Object.entries(extraHeaders)) {
    res.setHeader(name, value);
  }

  res.statusCode = statusCode;

  // end() sends the status line and headers if unsent, then the body,
  // completing the response.
  res.end(body);
}
