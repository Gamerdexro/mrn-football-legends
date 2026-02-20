// 🚀 Simple Railway WebSocket Server
const WebSocket = require('ws');

// Create WebSocket server
const wss = new WebSocket.Server({ 
  host: '0.0.0.0',
  port: process.env.PORT || 8080 
});

console.log('🎮 MRN Football Legends WebSocket Server started');
console.log('🌐 Port:', process.env.PORT || 8080);

// Handle connections
wss.on('connection', (ws) => {
  console.log('🔗 New player connected');
  
  ws.on('message', (message) => {
    console.log('📨 Received:', message.toString());
    
    // Echo back for testing
    ws.send(JSON.stringify({
      type: 'echo',
      message: 'Server received: ' + message.toString()
    }));
  });
  
  ws.on('close', () => {
    console.log('🔌 Player disconnected');
  });
  
  // Welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    message: 'Connected to MRN Football Legends WebSocket Server!'
  }));
});

// Health check endpoint
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket server is running');
});

server.listen(process.env.PORT || 8080, '0.0.0.0');

console.log('✅ Server ready for Railway deployment');
