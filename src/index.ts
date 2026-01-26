import http from 'http';
import env from './config/env.js';
import app from './app.js';
import Logger from './service/logger/index.js';
import Socket from './service/socket/index.js';

const { port, env: envName } = env;

const server = http.createServer(app);

Socket.listen(server);

server.listen(port, () => {
  Logger.info(`Server is running on port ${port} in ${envName} mode`);
});

