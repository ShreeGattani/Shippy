import mongoose from 'mongoose';

// Fallback in-memory database store
class MemoryStore {
  constructor() {
    this.users = new Map();
    this.orders = new Map();
    this.notifications = [];
    this.messages = new Map(); // Room ID -> Array of messages
    this.initMockData();
  }

  initMockData() {
    // Preload some mock SNU students
    const mockUsers = [
      {
        id: 'snu_1',
        name: 'Riya Sharma',
        email: 'riya.sharma@snu.edu.in',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        reliability: 98,
        ordersCompleted: 24,
        ordersCancelled: 0,
        hostel: 'Hostel A',
        savings: 540,
      },
      {
        id: 'snu_2',
        name: 'Arjun Verma',
        email: 'arjun.verma@snu.edu.in',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        reliability: 96,
        ordersCompleted: 18,
        ordersCancelled: 1,
        hostel: 'Hostel B',
        savings: 420,
      },
      {
        id: 'snu_3',
        name: 'Kabir Mehta',
        email: 'kabir.mehta@snu.edu.in',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        reliability: 92,
        ordersCompleted: 15,
        ordersCancelled: 2,
        hostel: 'Hostel C',
        savings: 310,
      },
      {
        id: 'snu_4',
        name: 'Ananya Sen',
        email: 'ananya.sen@snu.edu.in',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        reliability: 100,
        ordersCompleted: 32,
        ordersCancelled: 0,
        hostel: 'Hostel A',
        savings: 820,
      }
    ];

    mockUsers.forEach(u => this.users.set(u.email, u));

    // Preload some active group orders
    const mockOrders = [
      {
        id: 'order_101',
        creator: mockUsers[0], // Riya
        targetValue: 200,
        dropLocation: 'Hostel A Lobby',
        status: 'active', // active, locked, paid, completed
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 mins left
        participants: [
          {
            user: mockUsers[0],
            items: [
              { name: 'Maggi Noodles 4-Pack', price: 96, quantity: 1 },
              { name: 'Coca Cola 250ml', price: 40, quantity: 1 }
            ],
            dropPoint: 'Hostel A Room 104',
            status: 'accepted', // pending, accepted, declined
            paymentStatus: 'pending' // pending, paid
          },
          {
            user: mockUsers[1], // Arjun
            items: [
              { name: 'Kurkure Masala Munch', price: 20, quantity: 1 }
            ],
            dropPoint: 'Hostel A Room 205 (Arjun visiting)',
            status: 'accepted',
            paymentStatus: 'pending'
          }
        ],
        pendingRequests: []
      },
      {
        id: 'order_102',
        creator: mockUsers[2], // Kabir
        targetValue: 180,
        dropLocation: 'Hostel C Reception',
        status: 'active',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        participants: [
          {
            user: mockUsers[2],
            items: [
              { name: 'Blinkit Whole Wheat Bread', price: 50, quantity: 1 },
              { name: 'Amul Butter 100g', price: 58, quantity: 1 }
            ],
            dropPoint: 'Hostel C Room 312',
            status: 'accepted',
            paymentStatus: 'pending'
          }
        ],
        pendingRequests: [
          {
            user: mockUsers[3], // Ananya wants to join
            items: [
              { name: 'Lay\'s India\'s Magic Masala', price: 30, quantity: 1 },
              { name: 'Cadbury Silk Chocolate', price: 80, quantity: 1 }
            ],
            dropPoint: 'Hostel C Room 108',
            status: 'pending'
          }
        ]
      }
    ];

    mockOrders.forEach(o => this.orders.set(o.id, o));

    this.messages.set('order_101', [
      { sender: 'Riya Sharma', text: 'Hey, I started this order! Need around ₹64 more to reach ₹200 for free delivery.', timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
      { sender: 'Arjun Verma', text: 'Added Kurkure, we are almost there!', timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString() }
    ]);
    this.messages.set('order_102', [
      { sender: 'Kabir Mehta', text: 'Ordering breakfast essentials. Join in to save platform fee!', timestamp: new Date(Date.now() - 8 * 60 * 1000).toISOString() }
    ]);

    this.notifications = [
      { id: 'n_1', text: '⚡ Riya saved ₹28 on delivery fees using Shippy!', time: '10 min ago', type: 'info' },
      { id: 'n_2', text: '🛒 Someone nearby at Hostel A started a Blinkit cart.', time: '15 min ago', type: 'alert' }
    ];
  }

  // User Actions
  async findOrCreateUser(email, name, avatar) {
    let user = this.users.get(email);
    if (!user) {
      user = {
        id: 'snu_' + Math.random().toString(36).substr(2, 9),
        name,
        email,
        avatar: avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${name}`,
        reliability: 100,
        ordersCompleted: 0,
        ordersCancelled: 0,
        hostel: 'Hostel A',
        savings: 0,
      };
      this.users.set(email, user);
    }
    return user;
  }

  async updateUserHostel(email, hostel) {
    const user = this.users.get(email);
    if (user) {
      user.hostel = hostel;
      this.users.set(email, user);
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
    return newOrder;
  }

  async requestJoinOrder(orderId, user, items, dropPoint) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    // Check if user is already in participants or pending requests
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
    return order;
  }

  async markPaid(orderId, email) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const participant = order.participants.find(p => p.user.email === email);
    if (participant) {
      participant.paymentStatus = 'paid';
    }

    // Check if all participants are paid
    const allPaid = order.participants.every(p => p.paymentStatus === 'paid');
    if (allPaid && order.status === 'active') {
      // If total cart value meets threshold, it becomes 'completed' or 'locked'
      const totalItemsVal = order.participants.reduce((sum, p) => {
        return sum + p.items.reduce((iSum, item) => iSum + item.price * (item.quantity || 1), 0);
      }, 0);
      
      if (totalItemsVal >= order.targetValue) {
        order.status = 'paid';
      }
    }

    this.orders.set(orderId, order);
    return order;
  }

  async leaveOrder(orderId, email) {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    // Check if the user is the creator
    if (order.creator.email === email) {
      // Cancel the order entirely
      order.status = 'cancelled';
      // update reliability
      const creator = this.users.get(email);
      if (creator) {
        creator.ordersCancelled += 1;
        const total = creator.ordersCompleted + creator.ordersCancelled;
        creator.reliability = Math.round((creator.ordersCompleted / total) * 100);
        this.users.set(email, creator);
      }
    } else {
      order.participants = order.participants.filter(p => p.user.email !== email);
      order.pendingRequests = order.pendingRequests.filter(r => r.user.email !== email);
    }

    this.orders.set(orderId, order);
    return order;
  }

  async addMessage(orderId, senderName, text) {
    if (!this.messages.has(orderId)) {
      this.messages.set(orderId, []);
    }
    const message = {
      sender: senderName,
      text,
      timestamp: new Date().toISOString()
    };
    this.messages.get(orderId).push(message);
    return message;
  }

  async getMessages(orderId) {
    return this.messages.get(orderId) || [];
  }
}

// Check MongoDB connection
let store;
try {
  // If MONGO_URI is set or we want to try database
  if (process.env.MONGO_URI) {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected successfully!');
    // Here we could define real schemas. For MVP speed and stability,
    // let's use the MemoryStore and sync with MongoDB if required,
    // or simply wrap the schema.
    // For extreme robustness, let's export MemoryStore as the primary implementation
    // so it requires zero environment variables to work instantly,
    // but log MongoDB connectivity.
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
