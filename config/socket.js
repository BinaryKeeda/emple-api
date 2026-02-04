// socket/index.js
import { Server, Socket } from 'socket.io';
import { corsConfig } from './config.js';
import registerTestSocket from '../api-core-node/services/exam/index.js';
import { registerVideoConferenceSocket } from '../api-core-node/services/interview/interview.socket.js';

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: corsConfig,
  });
  console.log("Socket Inititalised");
  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
};

export const registerSocketEvents = (io ) => {
    io.on('connection', (socket) => {
      console.log('🟢 Socket connected:', socket.id)
      registerTestSocket(socket);
      registerVideoConferenceSocket(socket);


    });
}