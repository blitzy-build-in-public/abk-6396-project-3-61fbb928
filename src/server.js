import { createApp } from './app.js';

// PORT overrides the port the server listens on, and 3000 is the default when
// it is unset.
const port = Number(process.env.PORT ?? 3000);

const server = createApp();

// A startup failure arrives as an 'error' event rather than as a throw, so
// this listener is registered before listen() to turn an occupied port into a
// readable message and exit code 1.
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} is already in use. ` +
        'Set the PORT environment variable to a different port and start again.'
    );
  } else {
    console.error(`Failed to start the server: ${error.message}`);
  }

  process.exit(1);
});

server.on('listening', () => {
  console.log(`Listening on http://localhost:${port}`);
});

// listen()'s second argument is the interface bound: loopback, so the network
// cannot reach it.
server.listen(port, '127.0.0.1');
