import Express from 'express';
import Http from 'http';

import Environment from '@config/environment';

/**
 * Event listener for HTTP server "error" event.
 */
const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof app.get('port') === 'string'
    ? 'Pipe ' + app.get('port')
    : 'Port ' + app.get('port');

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  console.log('Listening on ' + bind);
}

/**
 * Create HTTP server and socket.io.
 */

const app = Express();
const server = Http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(Environment.server.port, onListening);
server.on('error', onError);
