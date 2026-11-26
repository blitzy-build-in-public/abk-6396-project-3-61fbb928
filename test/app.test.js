import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

// Shared with the tests: the server under test, and the URL it answers on.
let server;
let baseUrl;

before(async () => {
  server = createApp();

  // Port 0 lets the OS pick a free port, so a run cannot collide with one in use.
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });

  // Name the interface the server actually bound: 'localhost' can resolve to ::1.
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

// Closing here keeps a failing assertion from leaving a listener behind.
after(() => new Promise((resolve, reject) => {
  server.close((error) => (error ? reject(error) : resolve()));
}));

test('GET /hello answers 200 Hello world', async () => {
  const response = await fetch(`${baseUrl}/hello`);

  assert.equal(response.status, 200);

  // Read the header, not the body: fetch decodes text as UTF-8 regardless of charset.
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');

  // Compared exactly: no trailing newline, no JSON wrapper, no trimming.
  assert.equal(await response.text(), 'Hello world');
});

test('POST /hello answers 405 Method Not Allowed with Allow: GET', async () => {
  const response = await fetch(`${baseUrl}/hello`, { method: 'POST' });

  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
  assert.equal(await response.text(), 'Method Not Allowed');
});

test('GET /not-hello answers 404 Not Found', async () => {
  const response = await fetch(`${baseUrl}/not-hello`);

  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Not Found');
});

test('GET /hello?name=world answers 200 Hello world', async () => {
  const response = await fetch(`${baseUrl}/hello?name=world`);

  // Only the pathname is matched, so a query string changes nothing.
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'Hello world');
});
