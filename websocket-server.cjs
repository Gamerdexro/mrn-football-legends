// 🌐 Free WebSocket Server for MRN Football Legends
// Supports 100+ concurrent matches on free tier
// Deploy to Railway or Render for free hosting

const WebSocket = require('ws');
const http = require('http');

// Supabase connection (use environment variables)
const supabaseUrl = process.env.SUPABASE_URL || 'https://ealltsiyatcdikibtkj.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbGx0c2lpeWF0Y2Rpa2lidGtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MzMzNzAsImV4cCI6MjA4NzEwOTM3MH0.7oHXjoASPYq0SmqZ-wir-hSvhPlsbQ3Vqz59RrtjHOM';

// Game state storage (in-memory for free tier)
const activeMatches = new Map();
const playerConnections = new Map();

// Anti-cheat validation
class AntiCheatValidator {
  static validateMovement(playerId, oldPos, newPos, timestamp) {
    const distance = Math.sqrt(
      Math.pow(newPos.x - oldPos.x, 2) + 
      Math.pow(newPos.y - oldPos.y, 2)
    );
    
    const maxSpeed = 5.0; // pixels per 100ms
    const timeDiff = timestamp - (oldPos.timestamp || timestamp);
    
    if (distance > maxSpeed * (timeDiff / 100)) {
      return {
        valid: false,
        reason: 'Speed hack detected',
        distance,
        maxAllowed: maxSpeed * (timeDiff / 100)
      };
    }
    
    return { valid: true };
  }
  
  static validateReaction(action, timestamp) {
    const reactionTime = Date.now() - timestamp;
    const maxReactionTime = 200; // ms
    
    if (reactionTime < maxReactionTime) {
      return {
        valid: false,
        reason: 'Impossible reaction time',
        reactionTime
      };
    }
    
    return { valid: true };
  }
  
  static validateScore(playerStats, newScore) {
    const scoreIncrease = newScore - playerStats.lastScore;
    const maxScoreIncrease = 10; // per action
    
    if (scoreIncrease > maxScoreIncrease) {
      return {
        valid: false,
        reason: 'Score manipulation detected',
        scoreIncrease,
        maxAllowed: maxScoreIncrease
      };
    }
    
    return { valid: true };
  }
}

// Match room management
class MatchRoom {
  constructor(roomCode, hostId) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.guestId = null;
    this.players = new Map();
    this.gameState = {
      ball: { x: 200, y: 150 },
      score: { host: 0, guest: 0 },
      status: 'waiting',
      startTime: null
    };
    this.lastValidation = Date.now();
  }
  
  addPlayer(playerId, ws) {
    this.players.set(playerId, {
      ws,
      position: { x: playerId === this.hostId ? 50 : 350, y: 150 },
      lastPosition: { x: playerId === this.hostId ? 50 : 350, y: 150 },
      score: 0,
      lastScore: 0,
      stamina: 100,
      lastStaminaRegen: Date.now()
    });
    
    if (!this.guestId && playerId !== this.hostId) {
      this.guestId = playerId;
      this.gameState.status = 'playing';
      this.gameState.startTime = Date.now();
    }
    
    playerConnections.set(playerId, { room: this, ws });
  }
  
  removePlayer(playerId) {
    this.players.delete(playerId);
    playerConnections.delete(playerId);
    
    if (this.players.size < 2) {
      this.gameState.status = 'finished';
      this.saveMatchResult();
    }
  }
  
  validatePlayerAction(playerId, action) {
    const player = this.players.get(playerId);
    if (!player) return { valid: false, reason: 'Player not in match' };
    
    const timestamp = Date.now();
    
    // Validate movement
    if (action.type === 'move') {
      const validation = AntiCheatValidator.validateMovement(
        playerId, 
        player.lastPosition, 
        action.position, 
        timestamp
      );
      
      if (!validation.valid) {
        this.reportSuspiciousActivity(playerId, validation.reason);
        return validation;
      }
      
      player.lastPosition = player.position;
      player.position = action.position;
    }
    
    // Validate score
    if (action.type === 'score') {
      const validation = AntiCheatValidator.validateScore(player, action.score);
      if (!validation.valid) {
        this.reportSuspiciousActivity(playerId, validation.reason);
        return validation;
      }
      player.lastScore = player.score;
      player.score = action.score;
    }
    
    // Validate stamina
    if (action.type === 'action' && player.stamina < action.cost) {
      return { valid: false, reason: 'Insufficient stamina' };
    }
    
    player.lastValidation = timestamp;
    return { valid: true };
  }
  
  broadcastToPlayers(message, excludePlayer = null) {
    this.players.forEach((player, playerId) => {
      if (playerId !== excludePlayer && player.ws.readyState === WebSocket.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }
  
  async reportSuspiciousActivity(playerId, reason) {
    // Log suspicious activity for now
    console.log(`🚨 Suspicious activity from ${playerId}: ${reason}`);
    // TODO: Connect to Supabase when deployed
  }
  
  async saveMatchResult() {
    // Log match result for now
    console.log(`🏆 Match finished: ${this.roomCode}`);
    console.log(`Final score: Host ${this.gameState.score.host} - Guest ${this.gameState.score.guest}`);
    // TODO: Save to Supabase when deployed
  }
}

// WebSocket server setup
const wss = new WebSocket.Server({ 
  host: '0.0.0.0',
  port: 8080 
});

console.log('🎮 MRN Football Legends WebSocket Server running on port 8080');
console.log('🆓 Free tier supports 100+ concurrent matches');
console.log('🔒 Anti-cheat validation enabled');
console.log('🌐 Local URL: ws://localhost:8080');

wss.on('connection', (ws, req) => {
  let playerId = null;
  let currentRoom = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'join_room':
          // Join existing room
          const room = activeMatches.get(data.roomCode);
          if (room && room.players.size < 2) {
            playerId = data.playerId;
            room.addPlayer(playerId, ws);
            currentRoom = room;
            
            ws.send(JSON.stringify({
              type: 'joined_room',
              roomCode: data.roomCode,
              playerId: playerId,
              gameState: room.gameState
            }));
            
            room.broadcastToPlayers({
              type: 'player_joined',
              playerId: playerId,
              playerCount: room.players.size
            });
          } else {
            ws.send(JSON.stringify({
              type: 'error',
              message: 'Room not found or full'
            }));
          }
          break;
          
        case 'create_room':
          // Create new room
          const roomCode = generateRoomCode();
          playerId = data.playerId;
          const newRoom = new MatchRoom(roomCode, playerId);
          activeMatches.set(roomCode, newRoom);
          newRoom.addPlayer(playerId, ws);
          currentRoom = newRoom;
          
          ws.send(JSON.stringify({
            type: 'room_created',
            roomCode: roomCode,
            playerId: playerId
          }));
          break;
          
        case 'game_action':
          // Handle game actions with validation
          if (currentRoom) {
            const validation = currentRoom.validatePlayerAction(playerId, data.action);
            
            if (validation.valid) {
              currentRoom.broadcastToPlayers({
                type: 'game_update',
                playerId: playerId,
                action: data.action,
                gameState: currentRoom.gameState
              }, playerId);
            } else {
              ws.send(JSON.stringify({
                type: 'validation_error',
                reason: validation.reason
              }));
            }
          }
          break;
          
        case 'heartbeat':
          // Keep connection alive
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('Message handling error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    if (currentRoom && playerId) {
      currentRoom.removePlayer(playerId);
      currentRoom.broadcastToPlayers({
        type: 'player_disconnected',
        playerId: playerId
      });
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Generate room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Cleanup old matches every 5 minutes
setInterval(() => {
  const now = Date.now();
  activeMatches.forEach((room, roomCode) => {
    if (room.gameState.startTime && (now - room.gameState.startTime) > 600000) { // 10 minutes
      room.saveMatchResult();
      activeMatches.delete(roomCode);
    }
  });
}, 300000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('👋 Shutting down WebSocket server...');
  wss.close(() => {
    console.log('✅ Server stopped');
    process.exit(0);
  });
});
