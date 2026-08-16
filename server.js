import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { OAuth2Client } from 'google-auth-library';
import store from './store.js';

dotenv.config();

const googleClient = new OAuth2Client();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allow all origins for local testing
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

// Auth Routes
app.post('/api/auth/google', async (req, res) => {
  const { email, name, avatar, token } = req.body;
  
  let targetEmail = email;
  let targetName = name;
  let targetAvatar = avatar;

  if (token) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID || '953503260824-uapnh0b59b58jmtk4q2l8f41e57l25cr.apps.googleusercontent.com'
      });
      const payload = ticket.getPayload();
      targetEmail = payload.email;
      targetName = payload.name;
      targetAvatar = payload.picture;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid Google login credentials token' });
    }
  }

  if (!targetEmail) {
    return res.status(400).json({ error: 'Email or token is required' });
  }

  // Strict SNU email validation
  if (!targetEmail.toLowerCase().endsWith('@snu.edu.in')) {
    return res.status(403).json({ 
      error: 'Access Denied: Shippy is currently exclusive to Shiv Nadar University students (must use your @snu.edu.in email).' 
    });
  }

  try {
    const user = await store.findOrCreateUser(targetEmail, targetName, targetAvatar);
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/profile', async (req, res) => {
  const { email, hostel } = req.body;
  if (!email || !hostel) {
    return res.status(400).json({ error: 'Email and hostel are required' });
  }
  try {
    const user = await store.updateUserHostel(email, hostel);
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Order Routes
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await store.getOrders();
    // Filter out cancelled orders in lists
    const activeOrders = orders.filter(o => o.status !== 'cancelled');
    return res.json(activeOrders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await store.getOrder(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id/messages', async (req, res) => {
  try {
    const messages = await store.getMessages(req.params.id);
    return res.json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { email, targetValue, dropLocation } = req.body;
  if (!email || !targetValue || !dropLocation) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    const user = store.users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const order = await store.createOrder(user, targetValue, dropLocation);
    io.emit('order_created', order); // Broadcast to all for radar/feed
    return res.status(201).json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/join', async (req, res) => {
  const { email, items, dropPoint } = req.body;
  const orderId = req.params.id;

  if (!email || !items || !dropPoint) {
    return res.status(400).json({ error: 'Missing required join parameters' });
  }

  try {
    const user = store.users.get(email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const order = await store.requestJoinOrder(orderId, user, items, dropPoint);
    
    // Notify room of join request (for creator dashboard)
    io.to(orderId).emit('join_requested', { order, applicant: user });
    io.emit('order_updated', order); // Refresh on home/radar
    
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/items', async (req, res) => {
  const { email, items } = req.body;
  const orderId = req.params.id;

  if (!email || !items) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  try {
    const order = await store.updateItems(orderId, email, items);
    io.to(orderId).emit('room_updated', order);
    io.emit('order_updated', order);
    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/decision', async (req, res) => {
  const { participantEmail, action } = req.body; // 'accept' or 'decline'
  const orderId = req.params.id;

  if (!participantEmail || !action) {
    return res.status(400).json({ error: 'Missing decision parameters' });
  }

  try {
    const order = await store.handleRequestDecision(orderId, participantEmail, action);
    
    // Notify the room and public lists
    io.to(orderId).emit('room_updated', order);
    io.emit('order_updated', order);

    // Notify specific participant of decision
    io.emit('request_resolved', { orderId, participantEmail, action });

    // Add room message log
    const user = store.users.get(participantEmail);
    if (user) {
      const logText = action === 'accept' 
        ? `🎉 ${user.name} was accepted to the Shippy cart!` 
        : `❌ ${user.name}'s request to join was declined.`;
      const msg = await store.addMessage(orderId, 'SYSTEM', logText);
      io.to(orderId).emit('message_received', msg);
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/pay', async (req, res) => {
  const { email } = req.body;
  const orderId = req.params.id;

  try {
    const order = await store.markPaid(orderId, email);
    io.to(orderId).emit('room_updated', order);
    io.emit('order_updated', order);

    const user = store.users.get(email);
    if (user) {
      const msg = await store.addMessage(orderId, 'SYSTEM', `🔒 ${user.name} paid their share. Cart segment locked.`);
      io.to(orderId).emit('message_received', msg);
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders/:id/leave', async (req, res) => {
  const { email } = req.body;
  const orderId = req.params.id;

  try {
    const oldOrder = await store.getOrder(orderId);
    const order = await store.leaveOrder(orderId, email);
    
    const user = store.users.get(email);
    if (user) {
      if (oldOrder.creator.email === email) {
        // Organizer cancelled
        io.to(orderId).emit('order_cancelled', { orderId, reason: 'Organizer cancelled the Shippy' });
        io.emit('order_updated', order);
      } else {
        // Participant left
        io.to(orderId).emit('room_updated', order);
        io.emit('order_updated', order);
        const msg = await store.addMessage(orderId, 'SYSTEM', `🚪 ${user.name} left the Shippy cart.`);
        io.to(orderId).emit('message_received', msg);
      }
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Websocket Handling
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join_room', async ({ orderId, userName }) => {
    socket.join(orderId);
    console.log(`User ${userName} joined room: ${orderId}`);
  });

  socket.on('send_message', async ({ orderId, sender, text }) => {
    try {
      const message = await store.addMessage(orderId, sender, text);
      io.to(orderId).emit('message_received', message);
    } catch (e) {
      console.error('Error saving message:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Periodic mock simulator to make campus feel alive
// Adds mock items, mock join requests, or updates to the demo order every 90 seconds
setInterval(() => {
  try {
    const demoOrder = store.orders.get('order_101');
    if (demoOrder && demoOrder.status === 'active') {
      const totalItemsVal = demoOrder.participants.reduce((sum, p) => {
        return sum + p.items.reduce((iSum, item) => iSum + item.price * (item.quantity || 1), 0);
      }, 0);

      // If we haven't unlocked yet, simulate a mock user adding an item
      if (totalItemsVal < demoOrder.targetValue) {
        const arjun = demoOrder.participants.find(p => p.user.id === 'snu_2');
        if (arjun && arjun.items.length === 1) {
          // Arjun adds a milk carton
          arjun.items.push({ name: 'Amul Gold Milk 1L', price: 66, quantity: 1 });
          store.orders.set('order_101', demoOrder);
          io.to('order_101').emit('room_updated', demoOrder);
          io.emit('order_updated', demoOrder);

          store.addMessage('order_101', 'Arjun Verma', 'Added Amul Gold Milk! That should unlock it. 🎉').then(msg => {
            io.to('order_101').emit('message_received', msg);
          });
        }
      }
    }
  } catch (err) {
    console.error('Mock simulator error:', err);
  }
}, 45000);

const PORT = process.env.PORT || 5001;
httpServer.listen(PORT, () => {
  console.log(`Shippy server running on port ${PORT}`);
});
