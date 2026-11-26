# Node.js Hello world tutorial

One HTTP server, one endpoint, one response. This tutorial builds it with Node.js and nothing
else, shows the exact output of every command, and then explains the two source files that make
it work.

## 1. What you will build

A single Node.js process that starts an HTTP server and serves exactly one endpoint, `GET /hello`.
When an HTTP client asks for that path, the server answers with the literal text:

```text
Hello world
```

Those eleven bytes are the whole response body: no JSON wrapper, no HTML page, no trailing
newline. The server is built on the `node:http` module that ships with Node.js, so there is no
framework to learn, no dependency to install and no build step to run.

## 2. Prerequisites

| Prerequisite | Minimum | How to check it |
| --- | --- | --- |
| Node.js | 22.0.0 | `node -v` prints `v22.x` or higher |
| npm | ships with Node.js | `npm -v` prints a version |
| An HTTP client | any | `curl -i http://localhost:3000/hello` once the server is running; a browser address bar also works |

Node.js 22.0.0 is the floor this project declares in `package.json` as `"node": ">=22.0.0"`, so
`node -v` printing `v22.0.0` or anything newer means every command in this tutorial works as
written.

## 3. Install

From the repository root — the directory that holds `package.json` — run:

```bash
npm install
```

It downloads nothing. `package.json` declares no dependencies and no dev dependencies, so npm has
no package to fetch and no `node_modules/` to create. That is the point rather than an omission:
the lesson is what Node.js itself does with an HTTP request, and a dependency tree would be
scaffolding around an eleven-byte string.

Every command from here on runs from this same repository root.

## 4. Start the server

```bash
npm start
```

npm first echoes the script it is about to run, and then the server itself prints exactly one line
and waits:

```text
Listening on http://localhost:3000
```

That line means the server is listening on port 3000 of the loopback interface, `127.0.0.1`, so
only your own machine can reach it. This terminal now belongs to the server: leave it running and
open a second terminal for the next step.

## 5. Call the endpoint

In the second terminal, again from the repository root:

```bash
curl http://localhost:3000/hello
```

The body carries no trailing newline, so `curl` prints `Hello world` and your shell prompt
reappears on the same line. That is deliberate: the response is exactly the eleven bytes the
endpoint promises, so a client comparing the body to `Hello world` gets a match instead of a
twelfth byte it would have to strip.

`curl -i` is the readable form, because it prints the status line and the headers above the body:

```bash
curl -i http://localhost:3000/hello
```

```text
HTTP/1.1 200 OK
Content-Type: text/plain; charset=utf-8
Content-Length: 11

Hello world
```

`Date`, `Connection` and `Keep-Alive` vary from request to request and from client to client, and
header order is not significant, so those are the only lines you may see differ. Everything else —
the status line, the two headers and the body — is exactly what the server sends.
`Content-Length: 11` is the length of `Hello world` in bytes, and the server sets it explicitly so
the response is framed by its length rather than as a stream whose end the client must wait for.

The same request in a browser: open `http://localhost:3000/hello` in the address bar and the page
shows `Hello world` as plain text.

If you want a single number instead of a transcript:

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/hello
```

It prints:

```text
200
```

## 6. What just happened

Your request reached the request listener that `createApp()` passed to `createServer()`. The
listener took the pathname out of `req.url`, matched it against `/hello`, then matched
`req.method` against `GET`. That branch called `sendText()`, which set the status code, wrote
`Content-Type` and `Content-Length`, and ended the response with the body `Hello world`. Only the
pathname is compared, so a query string such as `?name=world` is not part of the match and changes
nothing.

## 7. The files, and why each exists

| File | Why it exists |
| --- | --- |
| `package.json` | Declares the two scripts this tutorial uses, `start` and `test`, along with the module system (`"type": "module"`) and the Node.js floor (`>=22.0.0`). |
| `package-lock.json` | The committed npm lockfile, which records the dependency set — it lists no package beyond the project itself. |
| `.gitignore` | Keeps `node_modules/` and `npm-debug.log*` out of version control. |
| `README.md` | This tutorial. |
| `src/app.js` | The application: `createApp()` returns a configured server that holds the routing table and the `sendText()` response helper, without starting it. |
| `src/server.js` | The entry point `npm start` runs: it resolves the port, binds the loopback interface, prints the startup line, and exits with code 1 if the port is already taken. |
| `test/app.test.js` | The `node:test` suite that asserts the endpoint contract over real HTTP. |

## 8. Try the other responses

The router answers every request, including the ones it does not serve. Ask for a path that does
not exist:

```bash
curl -i http://localhost:3000/nope
```

```text
HTTP/1.1 404 Not Found
Content-Type: text/plain; charset=utf-8
Content-Length: 9

Not Found
```

Then ask for `/hello` with a method the endpoint does not accept:

```bash
curl -i -X POST http://localhost:3000/hello
```

```text
HTTP/1.1 405 Method Not Allowed
Content-Type: text/plain; charset=utf-8
Content-Length: 18
Allow: GET

Method Not Allowed
```

`Allow: GET` tells a client which method the path does accept. The path is matched before the
method, so a wrong method on a path that does not exist is a 404, and the match is exact, so
`/hello/` with a trailing slash is a 404 as well.

## 9. Run the tests

Stop the server first with `Ctrl+C`, so the suite's own server and the one you were calling are
never confused for each other. Then:

```bash
npm test
```

`npm test` runs `node --test`, which discovers `test/app.test.js`. A passing run reports:

```text
pass 4
fail 0
```

The four tests are:

- `GET /hello` — 200, `Content-Type: text/plain; charset=utf-8`, body `Hello world`
- `POST /hello` — 405 with `Allow: GET`, body `Method Not Allowed`
- `GET /not-hello` — 404, body `Not Found`
- `GET /hello?name=world` — 200, body `Hello world`

Each test calls the server over TCP with `fetch`, so the assertions cover the real status line,
headers and body rather than a simulated request object. The suite binds port 0, which asks the
operating system for a free port, so a run never collides with a server you have running.

## 10. Stop the server, and change the port

`Ctrl+C` in the terminal that is running the server stops it.

To listen on a different port, set `PORT` when you start the server. On macOS and Linux:

```bash
PORT=8080 npm start
```

On Windows PowerShell:

```powershell
$env:PORT=8080; npm start
```

Either way the startup line names the port you chose:

```text
Listening on http://localhost:8080
```

and `curl -i http://localhost:8080/hello` returns the same response as before. With `PORT` unset,
the server uses 3000.

## 11. What this project does not include

- No web framework and no dependencies: the server is `node:http` and the tests are `node:test`,
  both of which ship with Node.js.
- No database, ORM or persistence of any kind: the response is a constant string.
- No authentication, sessions or cookies: there is no identity to check and no resource to
  protect.
- No other routes: no `/` route, no health check, no static file serving and no metrics endpoint.
- No request body parsing and no request-header handling: `Accept`, `Authorization` and `Origin`
  change nothing, and no CORS headers are sent.
- No HTTPS, HTTP/2, compression, caching or conditional-request handling: plain HTTP/1.1 on
  loopback only.
- No build step and no TypeScript: Node.js runs the source files directly.
- No linter, formatter, coverage gate or pre-commit hook: the project adds no tooling around six
  short files.
- No CI pipeline, no container image and no `Dockerfile`.
- No `LICENSE` file: choosing a licence is a decision for whoever adopts the project.
