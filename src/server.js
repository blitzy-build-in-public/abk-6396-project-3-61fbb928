import { createApp } from './app.js';

// PORT overrides the port the server listens on, and 3000 is the default when
// it is unset.
const port = Number(process.env.PORT ?? 3000);

// listen() refuses a PORT that is not a valid port number by throwing before
// any 'error' event is emitted, so a PORT that is not a whole number in range
// is refused here with the readable message and exit code 1 the listener
// below cannot supply. Port 0 stays accepted: it asks the operating system
// to pick a free port.
if (!Number.isInteger(port) || port < 0 || port > 65535) {
  console.error(
    'PORT must be a whole number between 0 and 65535. ' +
      'Set the PORT environment variable to a whole number in that range ' +
      'and start again.'
  );

  process.exit(1);
}

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
  // When PORT was 0 the socket was given a different port, so the line logs
  // the one it actually bound.
  console.log(`Listening on http://localhost:${server.address().port}`);
});

// listen()'s second argument is the interface bound: loopback, so the network
// cannot reach it.
server.listen(port, '127.0.0.1');
