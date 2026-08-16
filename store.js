import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Database Mongoose Schemas for MongoDB Persistence Mode
const UserSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: { type: String, unique: true },
  avatar: String,
  reliability: { type: Number, default: 100 },
  ordersCompleted: { type: Number, default: 0 },
  ordersCancelled: { type: Number, default: 0 },
  hostel: { type: String, default: 'Hostel A' },
  savings: { type: Number, default: 0 }
});

const OrderSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  creator: UserSchema,
  targetValue: Number,
  dropLocation: String,
  status: { type: String, default: 'active' },
  createdAt: String,
  expiresAt: String,
  participants: [mongoose.Schema.Types.Mixed],
  pendingRequests: [mongoose.Schema.Types.Mixed]
});

const MessageSchema = new mongoose.Schema({
  orderId: String,
  sender: String,
  text: String,
  timestamp: String
});

const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);
const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
const MessageModel = mongoose.models.Message || mongoose.model('Message', MessageSchema);

// Fallback in-memory database store with async Mongo synchronization
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.notifications = [];
    this.messages = new Map(); // Room ID -> Array of messages
    this.initMockData();
    
    // Load existing records from MongoDB in background
    this.loadFromMongo();
  }

  async loadFromMongo() {
    if (process.env.MONGO_URI) {
      try {
        const users = await UserModel.find({});
        for (const u of users) {
          this.users.set(u.email, u.toObject());
        }
        
        const orders = await OrderModel.find({});
        for (const o of orders) {
          this.orders.set(o.id, o.toObject());
        }
        
        const messages = await MessageModel.find({});
        for (const m of messages) {
          if (!this.messages.has(m.orderId)) {
            this.messages.set(m.orderId, []);
          }
          this.messages.get(m.orderId).push(m.toObject());
        }
        console.log(`Loaded ${this.users.size} users, ${this.orders.size} orders, and ${messages.length} messages from MongoDB!`);
      } catch (err) {
        console.error('Error loading data from MongoDB:', err);
      }
    }
  }

  initMockData() {
    // Mock dataset removed for clean database setup
  }

  // User Actions
  async findOrCreateUser(email, name, avatar) {
    let user = this.users.get(email);
    if (!user) {
      user = {
        id: 'snu_' + Math.random().toString(36).substr(2, 9),
        name: name || email.split('@')[0],
        email,
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name || email}`,
        reliability: 100,
        ordersCompleted: 0,
        ordersCancelled: 0,
        hostel: 'Hostel A',
        savings: 0,
      };
      this.users.set(email, user);
      
      if (process.env.MONGO_URI) {
        UserModel.create(user).catch(err => console.error('Error saving user to MongoDB:', err));
      }
    }
    return user;
  }

  async updateUserHostel(email, hostel) {
    const user = this.users.get(email);
    if (user) {
      user.hostel = hostel;
      this.users.set(email, user);
      
      if (process.env.MONGO_URI) {
        UserModel.updateOne({ email }, { hostel }).catch(err => console.error('Error updating user hostel in MongoDB:', err));
      }
    }
    return user;
  }

  async getOrders() {
    return Array.from(this.orders.values());
  }

  async getOrder(id) {
    return this.orders.get(id) || null;
  }

  async createOrder(user, targetValue, dropLocation) {
    const newOrder = {
      id: 'order_' + Math.random().toString(36).substr(2, 9),
      creator: user,
      targetValue: parseFloat(targetValue) || 160,
      dropLocation,
      status: 'active',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
      participants: [
        {
          user,
          items: [],
          dropPoint: dropLocation,
          status: 'accepted',
          paymentStatus: 'pending'
        }
      ],
      pendingRequests: []
    };
    this.orders.set(newOrder.id, newOrder);
    
    if (process.env.MONGO_URI) {
      OrderModel.create(newOrder).catch(err => console.error('Error saving order to MongoDB:', err));
    }
    return newOrder;
  }

  async requestJoinOrder(orderId, user, items, dropPoint) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const isParticipant = order.participants.some(p => p.user.email === user.email);
    const isPending = order.pendingRequests.some(p => p.user.email === user.email);

    if (isParticipant || isPending) {
      throw new Error('You have already requested to join or are a participant in this order');
    }

    const request = {
      user,
      items,
      dropPoint,
      status: 'pending'
    };
    order.pendingRequests.push(request);
    this.orders.set(orderId, order);
    
    if (process.env.MONGO_URI) {
      OrderModel.updateOne({ id: orderId }, order).catch(err => console.error('Error saving request to MongoDB:', err));
    }
    return order;
  }

  async updateItems(orderId, email, items) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const participant = order.participants.find(p => p.user.email === email);
    if (participant) {
      participant.items = items;
    } else {
      const request = order.pendingRequests.find(p => p.user.email === email);
      if (request) {
        request.items = items;
      }
    }
    this.orders.set(orderId, order);
    
    if (process.env.MONGO_URI) {
      OrderModel.updateOne({ id: orderId }, order).catch(err => console.error('Error updating items in MongoDB:', err));
    }
    return order;
  }

  async handleRequestDecision(orderId, participantEmail, action) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const reqIndex = order.pendingRequests.findIndex(r => r.user.email === participantEmail);
    if (reqIndex === -1) throw new Error('Join request not found');

    const request = order.pendingRequests[reqIndex];
    order.pendingRequests.splice(reqIndex, 1);

    if (action === 'accept') {
      const newParticipant = {
        user: request.user,
        items: request.items,
        dropPoint: request.dropPoint,
        status: 'accepted',
        paymentStatus: 'pending'
      };
      order.participants.push(newParticipant);
    }
    
    this.orders.set(orderId, order);
    
    if (process.env.MONGO_URI) {
      OrderModel.updateOne({ id: orderId }, order).catch(err => console.error('Error updating request decision in MongoDB:', err));
    }
    return order;
  }

  async markPaid(orderId, email) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const participant = order.participants.find(p => p.user.email === email);
    if (participant) {
      participant.paymentStatus = 'paid';
    }

    const allPaid = order.participants.every(p => p.paymentStatus === 'paid');
    if (allPaid && order.status === 'active') {
      const totalItemsVal = order.participants.reduce((sum, p) => {
        return sum + p.items.reduce((iSum, item) => iSum + item.price * (item.quantity || 1), 0);
      }, 0);
      
      if (totalItemsVal >= order.targetValue) {
        order.status = 'paid';
      }
    }

    this.orders.set(orderId, order);
    
    if (process.env.MONGO_URI) {
      OrderModel.updateOne({ id: orderId }, order).catch(err => console.error('Error updating paid status in MongoDB:', err));
    }
    return order;
  }

  async leaveOrder(orderId, email) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    if (order.creator.email === email) {
      order.status = 'cancelled';
      const creator = this.users.get(email);
      if (creator) {
        creator.ordersCancelled += 1;
        const total = creator.ordersCompleted + creator.ordersCancelled;
        creator.reliability = Math.round((creator.ordersCompleted / total) * 100);
        this.users.set(email, creator);
        
        if (process.env.MONGO_URI) {
          UserModel.updateOne({ email }, { ordersCancelled: creator.ordersCancelled, reliability: creator.reliability }).catch(err => console.error(err));
        }
      }
    } else {
      order.participants = order.participants.filter(p => p.user.email !== email);
      order.pendingRequests = order.pendingRequests.filter(r => r.user.email !== email);
    }

    this.orders.set(orderId, order);
    
    if (process.env.MONGO_URI) {
      OrderModel.updateOne({ id: orderId }, order).catch(err => console.error('Error updating order leave in MongoDB:', err));
    }
    return order;
  }

  async addMessage(orderId, senderName, text) {
    if (!this.messages.has(orderId)) {
      this.messages.set(orderId, []);
    }
    const message = {
      orderId,
      sender: senderName,
      text,
      timestamp: new Date().toISOString()
    };
    this.messages.get(orderId).push(message);
    
    if (process.env.MONGO_URI) {
      MessageModel.create(message).catch(err => console.error('Error saving message to MongoDB:', err));
    }
    return message;
  }

  async getMessages(orderId) {
    return this.messages.get(orderId) || [];
  }
}

// Check MongoDB connection
let store;
try {
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');
    store = new MemoryStore();
  } else {
    console.log('No MongoDB URI found, initializing pre-loaded MemoryStore.');
    store = new MemoryStore();
  }
} catch (e) {
  console.warn('MongoDB connection failed. Initializing MemoryStore fallback:', e.message);
  store = new MemoryStore();
}

export default store;
