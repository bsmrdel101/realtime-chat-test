const express = require('express');
const app = express();
const http = require('http');
const { createServer } = require('vite');
const { Server } = require('socket.io');
const path = require('path');

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

async function startServer() {
  // Create Vite development server
  const vite = await createServer({
    server: {
      middlewareMode: true,
      fs: {
        strict: false,
      },
    },
  });

  app.use(express.static(path.join(__dirname, 'public')));

  // Socket.io setup
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
    transports: ['websocket'],
  });

  io.on('connection', (socket) => {
    socket.on('SEND_MESSAGE', (msg) => {
      io.emit('SEND_MESSAGE', msg);
    });
  });

  app.get("/api/hello", (_req, res) => {
    res.json({ message: "Hello, world!" });
  });

  app.all('*', async (req, res) => {
    try {
      const url = req.originalUrl;
      const template = await vite.transformIndexHtml(url, '<div id="app"></div>');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (error) {
      vite.ssrFixStacktrace(error);
      console.error(error);
      res.status(500).end(error.message);
    }
  });

  const PORT = process.env.PORT || 8080;

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log('=======================');
  });
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});