export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  reliability: number;
  ordersCompleted: number;
  ordersCancelled: number;
  hostel: string;
  savings: number;
}

export interface Item {
  name: string;
  price: number;
  quantity: number;
}

export interface Participant {
  user: User;
  items: Item[];
  dropPoint: string;
  status: 'pending' | 'accepted' | 'declined';
  paymentStatus: 'pending' | 'paid';
}

export interface Order {
  id: string;
  creator: User;
  targetValue: number;
  dropLocation: string;
  status: 'active' | 'locked' | 'paid' | 'completed' | 'cancelled';
  createdAt: string;
  expiresAt: string;
  participants: Participant[];
  pendingRequests: Participant[];
}

export interface Message {
  sender: string;
  text: string;
  timestamp: string;
}

export interface ShippyNotification {
  id: string;
  text: string;
  time: string;
  type: 'info' | 'alert' | 'success';
}
