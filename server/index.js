import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { Game } from './gameLogic.js';
import { TICK_INTERVAL, MSG_TYPES, PLAYER_COLORS } from '../shared/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(express.static(path.join(__dirname, '../client')));
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Multi-room management
const rooms = new Map(); // roomId -> Game

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Create or Join Room
  socket.on(MSG_TYPES.CREATE_ROOM, (data) => {
    const roomId = Math.random().toString(36).substring(7);
    const game = new Game({
      id: roomId,
      mapType: data.mapType,
      aiLevel: data.aiLevel
    });
    
    rooms.set(roomId, game);
    joinRoom(socket, roomId, data.nickname);
  });

  socket.on(MSG_TYPES.JOIN_ROOM, (data) => {
    if (rooms.has(data.roomId)) {
      joinRoom(socket, data.roomId, data.nickname);
    } else {
      socket.emit(MSG_TYPES.ERROR, 'Room not found');
    }
  });

  socket.on(MSG_TYPES.SEND_TROOPS, (data) => {
    // Find room
    rooms.forEach((game, roomId) => {
      if (game.players.has(socket.id)) {
        game.handleSendTroops(socket.id, data.sourceId, data.targetId);
      }
    });
  });

  socket.on('disconnect', () => {
    // Find room the user was in
    rooms.forEach((game, roomId) => {
      if (game.players.has(socket.id)) {
        game.removePlayer(socket.id);
        io.to(roomId).emit(MSG_TYPES.PLAYER_LEFT, socket.id);
        
        // Clean up empty rooms (except maybe some persistent ones if needed)
        if (game.players.size === 0) {
          // Keep AI rooms alive? No, clean up for now.
          rooms.delete(roomId);
        }
      }
    });
  });
});

function joinRoom(socket, roomId, nickname) {
  const game = rooms.get(roomId);
  const color = PLAYER_COLORS[Math.floor(Math.random() * PLAYER_COLORS.length)];
  
  socket.join(roomId);
  game.addPlayer(socket.id, nickname || 'Unknown', color);
  
  socket.emit(MSG_TYPES.INITIAL_STATE, { ...game.getFullState(), roomId });
  
  socket.to(roomId).emit(MSG_TYPES.PLAYER_JOINED, { 
    id: socket.id, 
    nickname: nickname, 
    color 
  });
}

/**
 * Global Tick Loop for all active rooms
 */
setInterval(() => {
  rooms.forEach((game, roomId) => {
    const state = game.update();
    io.to(roomId).emit(MSG_TYPES.GAME_UPDATE, state);
  });
}, TICK_INTERVAL);

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
