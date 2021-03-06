import Express from 'express';
import Http from 'http';
import SocketIO from 'socket.io';
import Path from 'path';

import Environment from '@config/environment';
import { ChatSocket } from '@chat/chat.socket';

/**
 * Create HTTP server and socket.io.
 */

const app = Express();
const server = Http.createServer(app);
const io = SocketIO(server);

app.set('port', process.env.PORT || Environment.server.port);
// For heroku:
if (Environment.env === 'production') {
  app
    .use(Express.static(Path.join(__dirname + "/../../client")))
    .get('*', (req, res) => res.sendFile(Path.join(__dirname + "/../../client/index.html")));
}

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
 * Listen on provided port, on all network interfaces.
 */
server.listen(app.get('port'), onListening);
server.on('error', onError);

const chatSocket = new ChatSocket(io);
const onProcessExit = (_signal: string) => {
  chatSocket.stop();
  process.exit(0);
}
process.on('SIGINT', onProcessExit);
process.on('SIGTERM', onProcessExit);

chatSocket.start();
