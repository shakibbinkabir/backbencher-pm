import { io } from 'socket.io-client';

const serverUrl = 'ws://localhost:3000';

async function testWebSocket() {
  console.log('Connecting to WebSocket server...');
  
  // Replace with a valid JWT token for testing
  const testToken = 'your-jwt-token-here';
  
  const socket = io(serverUrl, {
    auth: {
      token: testToken
    },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('✅ Connected to WebSocket server');
    console.log('Socket ID:', socket.id);
  });

  socket.on('connected', (data) => {
    console.log('✅ Connection confirmed:', data);
    
    // Test joining a project room
    console.log('🔄 Joining project room...');
    socket.emit('join_room', { room: 'project_test-project-id' });
  });

  socket.on('room_joined', (data) => {
    console.log('✅ Joined room:', data);
  });

  socket.on('notification', (data) => {
    console.log('🔔 Received notification:', data);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  // Keep the process alive for testing
  process.on('SIGINT', () => {
    console.log('\nDisconnecting...');
    socket.disconnect();
    process.exit(0);
  });

  console.log('WebSocket test client started. Press Ctrl+C to exit.');
}

testWebSocket().catch(console.error);
