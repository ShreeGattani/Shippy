import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, MessageSquare, Send, CheckCircle2, AlertTriangle, UserCheck, XCircle, CreditCard, ChevronDown, ChevronUp, ArrowLeft, LogOut, Check, Plus, X } from 'lucide-react';
import io from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { API_BASE, SOCKET_URL } from '../config';
import type { Order, User, Item, Message } from '../types';

interface OrderRoomProps {
  orderId: string;
  currentUser: User;
  onBack: () => void;
}

export const OrderRoom: React.FC<OrderRoomProps> = ({ orderId, currentUser, onBack }) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Join request drawer state
  const [showJoinRequestDrawer, setShowJoinRequestDrawer] = useState(false);
  const [joinItems, setJoinItems] = useState<Item[]>([]);
  const [joinItemName, setJoinItemName] = useState('');
  const [joinItemPrice, setJoinItemPrice] = useState('');
  const [joinDropPoint, setJoinDropPoint] = useState('');

  // Payment simulator state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'options' | 'processing' | 'success'>('options');
  const [selectedUPI, setSelectedUPI] = useState('gpay');

  // Receipt expanded state
  const [receiptExpanded, setReceiptExpanded] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch initial order details
  const fetchOrderDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`);
      if (!res.ok) throw new Error('Failed to load order');
      const data = await res.json();
      
      // If order has transitioned to unlocked/completed, trigger confetti once
      const getAcceptedSum = (ord: Order) => ord.participants
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);

      const oldSum = order ? getAcceptedSum(order) : 0;
      const newSum = getAcceptedSum(data);
      if (newSum >= data.targetValue && oldSum < data.targetValue) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }

      setOrder(data);
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    fetchMessages();

    // Connect socket
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.emit('join_room', { orderId, userName: currentUser.name });

    socket.on('message_received', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('room_updated', (updatedOrder: Order) => {
      setOrder(updatedOrder);
    });

    socket.on('join_requested', ({ order: updatedOrder }: { order: Order }) => {
      setOrder(updatedOrder);
    });

    socket.on('order_cancelled', () => {
      alert('This Shippy order was cancelled by the organizer.');
      onBack();
    });

    socket.on('request_resolved', ({ orderId: resId, participantEmail, action }) => {
      if (resId === orderId && participantEmail === currentUser.email) {
        fetchOrderDetails();
        alert(action === 'accept' ? '🎉 Your request to join the Shippy was ACCEPTED!' : '❌ Your request to join the Shippy was declined.');
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      orderId,
      sender: currentUser.name,
      text: newMessage
    });
    setNewMessage('');
  };

  // Creator Dashboard Accept/Decline decision
  const handleDecision = async (participantEmail: string, action: 'accept' | 'decline') => {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantEmail, action })
      });
      if (!res.ok) throw new Error('Action failed');
      const data = await res.json();
      setOrder(data);
    } catch (e) {
      alert('Error: ' + e);
    }
  };

  // Submit Join Request items
  const handleAddJoinItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinItemName || !joinItemPrice) return;
    
    const priceNum = parseFloat(joinItemPrice);
    if (isNaN(priceNum) || priceNum <= 0) return;

    setJoinItems([...joinItems, { name: joinItemName, price: priceNum, quantity: 1 }]);
    setJoinItemName('');
    setJoinItemPrice('');
  };

  const submitJoinRequest = async () => {
    if (joinItems.length === 0) {
      alert('Please add at least one item.');
      return;
    }
    if (!joinDropPoint) {
      alert('Please enter your specific drop point (room number, room location, etc.).');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          items: joinItems,
          dropPoint: joinDropPoint
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || 'Failed to submit request');
        return;
      }
      
      const data = await res.json();
      setOrder(data);
      setShowJoinRequestDrawer(false);
      setJoinItems([]);
      setJoinDropPoint('');
      
      // Log request in chat locally
      if (socketRef.current) {
        socketRef.current.emit('send_message', {
          orderId,
          sender: 'SYSTEM',
          text: `🔔 ${currentUser.name} requested to join the cart from ${joinDropPoint}.`
        });
      }
    } catch (e) {
      alert('Error submitting join request');
    }
  };

  // Leave Shippy Order
  const handleLeaveOrder = async () => {
    const confirmText = order?.creator.email === currentUser.email 
      ? 'Warning: As the organizer, leaving will CANCEL the entire Shippy cart. Proceed?' 
      : 'Are you sure you want to leave this Shippy cart?';
      
    if (!window.confirm(confirmText)) return;

    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      if (res.ok) {
        onBack();
      }
    } catch (e) {
      alert('Error leaving Shippy');
    }
  };

  // simulated payment confirmation
  const handleSimulatePayment = async () => {
    setPaymentStep('processing');
    
    // Simulate API bank ping
    setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/${orderId}/pay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: currentUser.email })
        });
        
        if (res.ok) {
          setPaymentStep('success');
          fetchOrderDetails();
        } else {
          setPaymentStep('options');
          alert('Simulated payment registration failed.');
        }
      } catch (e) {
        setPaymentStep('options');
        alert('Server communication error during checkout.');
      }
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-shippy-bg noise-bg h-full">
        <div className="w-12 h-12 rounded-full border-4 border-shippy-orange border-t-transparent animate-spin mb-4" />
        <span className="text-xs font-bold text-shippy-brown uppercase tracking-wider">Syncing room data...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-shippy-bg noise-bg h-full">
        <AlertTriangle className="w-12 h-12 text-shippy-orange mb-4" />
        <h3 className="text-base font-bold text-shippy-charcoal mb-1">Shippy Order Not Found</h3>
        <p className="text-xs text-shippy-brown mb-4 text-center max-w-[240px]">It may have been completed, cancelled, or is temporarily unavailable.</p>
        <button onClick={onBack} className="bg-shippy-charcoal text-white text-xs font-bold px-4 py-2.5 rounded-xl">Go Back</button>
      </div>
    );
  }

  // Calculate order statistics
  const acceptedParticipants = order.participants.filter(p => p.status === 'accepted');
  const totalValue = acceptedParticipants.reduce((sum, p) => {
    return sum + p.items.reduce((iSum, item) => iSum + item.price * item.quantity, 0);
  }, 0);

  const percentage = Math.min(Math.round((totalValue / order.targetValue) * 100), 100);
  const needed = Math.max(order.targetValue - totalValue, 0);
  const isUnlocked = totalValue >= order.targetValue;

  // Split bill formula:
  // If unlocked -> delivery fee ₹0. Platform charges = ₹10 + Taxes = ₹10. Total shared = ₹20.
  // If locked -> delivery fee ₹30. Platform charges = ₹10 + Taxes = ₹10. Total shared = ₹50.
  const sharedFees = isUnlocked ? 20 : 50;
  
  // Current user's cart summary
  const myParticipant = acceptedParticipants.find(p => p.user.email === currentUser.email);
  const myItemsTotal = myParticipant?.items.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  const myProportionalShare = totalValue > 0 ? (myItemsTotal / totalValue) * sharedFees : 0;
  const myGrandTotal = Math.round(myItemsTotal + myProportionalShare);

  const isCreator = order.creator.email === currentUser.email;
  const isMember = acceptedParticipants.some(p => p.user.email === currentUser.email);
  const isPendingApproval = order.pendingRequests.some(p => p.user.email === currentUser.email);

  return (
    <div className="flex-1 flex flex-col h-full bg-shippy-bg relative noise-bg overflow-hidden">
      {/* Confetti Celebration Overlay */}
      {showConfetti && (
        <div className="absolute inset-0 bg-white/5 pointer-events-none z-50 overflow-hidden flex flex-col items-center justify-center">
          <div className="text-center bg-white/95 border border-shippy-border/80 px-6 py-5 rounded-[28px] shadow-2xl animate-bounce">
            <span className="text-4xl block mb-2">🎉</span>
            <h2 className="text-2xl font-extrabold text-shippy-charcoal leading-none">ORDER UNLOCKED</h2>
            <p className="text-xs font-bold text-shippy-orange mt-2 uppercase tracking-wide">You Shippied it! Target achieved.</p>
          </div>
          {/* Simulated Confetti pieces */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                backgroundColor: ['#E06A3B', '#47825E', '#3E3830', '#FFF200'][i % 4],
                left: `${Math.random() * 100}%`,
                top: `-10px`
              }}
              animate={{
                y: ['0vh', '100vh'],
                x: [`0px`, `${(Math.random() - 0.5) * 200}px`],
                rotate: [0, 360]
              }}
              transition={{
                duration: Math.random() * 2 + 1.5,
                repeat: Infinity,
                delay: Math.random() * 1.5
              }}
            />
          ))}
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-white border-b border-shippy-border/80 px-4 py-3 flex items-center justify-between z-20">
        <button onClick={onBack} className="text-shippy-charcoal hover:text-shippy-orange">
          <ArrowLeft className="w-5 h-5 md:hidden" />
          <X className="w-5 h-5 hidden md:block" />
        </button>
        <div className="text-center">
          <span className="text-xs font-extrabold text-shippy-charcoal block leading-none">BLINKIT GROUP CART</span>
          <span className="text-[10px] text-shippy-brown/60 block font-bold mt-0.5">Order #{order.id.split('_')[1]}</span>
        </div>
        <button onClick={handleLeaveOrder} className="text-shippy-brown/60 hover:text-red-600 transition-colors">
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* Main split scrolling panel */}
      <div className="flex-1 overflow-y-auto pb-4">
        
        {/* Progress Card */}
        <div className="bg-white border-b border-shippy-border/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-extrabold text-shippy-charcoal">
              <ShoppingBag className="w-4 h-4 text-shippy-orange" />
              Delivery Drop: {order.dropLocation}
            </span>
            {isUnlocked ? (
              <span className="bg-shippy-green/10 text-shippy-green text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                Target Met
              </span>
            ) : (
              <span className="bg-shippy-orange/10 text-shippy-orange text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                ₹{needed} Left
              </span>
            )}
          </div>

          <div className="w-full bg-shippy-cream h-3 rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className={`h-full rounded-full ${isUnlocked ? 'bg-shippy-green' : 'bg-shippy-orange'}`}
            />
          </div>

          <div className="flex justify-between text-xs font-bold text-shippy-brown">
            <span>₹{totalValue} / ₹{order.targetValue}</span>
            <span>{percentage}% unlocked</span>
          </div>
        </div>

        {/* Creator Dashboard (Accept/Decline Requests) */}
        {isCreator && order.pendingRequests.length > 0 && (
          <div className="bg-[#FFF8F0] border-y border-shippy-orange/20 p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-shippy-orange uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Pending Join Requests ({order.pendingRequests.length})
              </h4>
            </div>

            <div className="space-y-3">
              {order.pendingRequests.map((req) => {
                const reqTotal = req.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return (
                  <div key={req.user.email} className="bg-white border border-shippy-border/80 rounded-2xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <img src={req.user.avatar} className="w-8 h-8 rounded-full border border-shippy-border" alt="" />
                        <div>
                          <div className="text-xs font-extrabold text-shippy-charcoal leading-none">{req.user.name}</div>
                          <span className="text-[9px] font-bold text-shippy-green">★ {req.user.reliability}% Reliability</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-extrabold text-shippy-charcoal">₹{reqTotal}</div>
                        <span className="text-[9px] font-bold text-shippy-brown/60">Drop: {req.dropPoint}</span>
                      </div>
                    </div>

                    <div className="bg-shippy-bg rounded-xl p-2.5 space-y-1 mb-3 text-[10px] font-semibold text-shippy-brown">
                      {req.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span>{it.name} (x{it.quantity})</span>
                          <span>₹{it.price}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(req.user.email, 'decline')}
                        className="flex-1 border border-red-200 hover:bg-red-50 text-red-600 font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                      <button
                        onClick={() => handleDecision(req.user.email, 'accept')}
                        className="flex-1 bg-shippy-green hover:bg-shippy-green/90 text-white font-bold py-1.5 rounded-xl text-[10px] flex items-center justify-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Accept
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Not Joined Case */}
        {!isMember && !isPendingApproval && (
          <div className="m-4 bg-white border border-shippy-border/90 rounded-3xl p-5 shadow-xs text-center flex flex-col items-center">
            <ShoppingBag className="w-8 h-8 text-shippy-orange mb-2" />
            <h4 className="text-sm font-bold text-shippy-charcoal mb-1">Want to join this group order?</h4>
            <p className="text-[11px] text-shippy-brown/85 font-medium max-w-[200px] mb-4">
              Add your Blinkit items and specify your room number for delivery coordination.
            </p>
            <button
              onClick={() => setShowJoinRequestDrawer(true)}
              className="bg-shippy-orange hover:bg-shippy-orange/95 text-white text-xs font-bold py-2 px-5 rounded-xl shadow-xs"
            >
              + ADD MY ITEMS TO CART
            </button>
          </div>
        )}

        {/* Pending Request Banner */}
        {!isMember && isPendingApproval && (
          <div className="m-4 bg-[#FFFDF0] border border-amber-200 rounded-3xl p-5 text-center flex flex-col items-center">
            <AlertTriangle className="w-7 h-7 text-amber-500 mb-2" />
            <h4 className="text-xs font-extrabold text-amber-800 mb-1">Request Pending Approval</h4>
            <p className="text-[10px] text-amber-700 font-semibold max-w-[200px]">
              The organizer has been notified and needs to accept you into the Shippy cart.
            </p>
          </div>
        )}

        {/* Cart Members and Items list */}
        <div className="px-4 py-4 space-y-4">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 mb-1">Cart Participants</h4>

          {acceptedParticipants.map((p) => {
            const pTotal = p.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            const isMe = p.user.email === currentUser.email;

            return (
              <div key={p.user.email} className="bg-white border border-shippy-border/80 rounded-3xl p-4 shadow-2xs">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <img src={p.user.avatar} className="w-8 h-8 rounded-full border border-shippy-border" alt="" />
                    <div>
                      <span className="text-xs font-extrabold text-shippy-charcoal leading-none block">
                        {p.user.name} {isMe && '(You)'}
                      </span>
                      <span className="text-[9px] font-bold text-shippy-brown/60 block mt-0.5">
                        Drop: {p.dropPoint}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-xs font-extrabold text-shippy-charcoal">₹{pTotal}</span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 ${
                      p.paymentStatus === 'paid' 
                        ? 'bg-shippy-green/10 text-shippy-green' 
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {p.paymentStatus === 'paid' ? 'PAID / LOCKED' : 'PENDING PAYMENT'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {p.items.length === 0 ? (
                    <div className="text-[10px] font-semibold text-shippy-brown/50 italic">No items added yet</div>
                  ) : (
                    p.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-[11px] font-semibold text-shippy-brown px-1.5 py-1 bg-shippy-bg rounded-lg">
                        <span>{it.name}</span>
                        <span>₹{it.price}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time Group Chat & Logs */}
        {isMember && (
          <div className="mx-4 border border-shippy-border rounded-[28px] overflow-hidden bg-white shadow-2xs flex flex-col h-72">
            <div className="bg-shippy-bg border-b border-shippy-border/60 px-4 py-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-shippy-charcoal flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-shippy-orange" />
                Live Coordination Chat
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-shippy-green animate-pulse" />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, idx) => {
                const isSystem = msg.sender === 'SYSTEM';
                const isMe = msg.sender === currentUser.name;

                if (isSystem) {
                  return (
                    <div key={idx} className="text-center">
                      <span className="inline-block bg-shippy-cream text-shippy-brown border border-shippy-border/50 text-[10px] font-bold px-3 py-1 rounded-full leading-normal">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-bold text-shippy-brown/60 mb-0.5 px-1">{msg.sender}</span>
                    <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-xs font-semibold leading-relaxed ${
                      isMe 
                        ? 'bg-shippy-charcoal text-white rounded-tr-none' 
                        : 'bg-shippy-cream text-shippy-charcoal rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-shippy-border/60 p-2 flex gap-2">
              <input
                type="text"
                placeholder="Type coordination message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
              />
              <button type="submit" className="bg-shippy-orange hover:bg-shippy-orange/95 text-white p-2 rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Bill Splitting Receipt & Checkout Drawer (Docked at Bottom) */}
      {isMember && myParticipant && (
        <div className="bg-white border-t border-shippy-border/80 shadow-lg z-20">
          {/* Header click toggles bill explanation details */}
          <div 
            onClick={() => setReceiptExpanded(!receiptExpanded)}
            className="px-5 py-3.5 flex items-center justify-between border-b border-shippy-border/40 cursor-pointer hover:bg-shippy-bg"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-shippy-charcoal">YOUR SHIPPY TOTAL</span>
              <span className="text-lg font-extrabold text-shippy-orange">₹{myGrandTotal}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-shippy-brown/60">
              <span>View Breakdown</span>
              {receiptExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </div>

          {/* Expanded Receipt Breakdown */}
          {receiptExpanded && (
            <div className="px-5 py-4 bg-shippy-bg space-y-3 border-b border-shippy-border/40 text-xs font-semibold text-shippy-brown leading-relaxed">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{myItemsTotal}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shared fees (Platform + Delivery)</span>
                <span className="text-shippy-charcoal">₹{Math.round(myProportionalShare)}</span>
              </div>
              
              <div className="bg-white border border-shippy-border/60 rounded-xl p-2.5 text-[10px] font-bold text-shippy-brown/75 mt-2">
                💡 <strong className="text-shippy-charcoal">Proportional Split Formula:</strong> Your items represent {totalValue > 0 ? Math.round((myItemsTotal / totalValue) * 100) : 0}% of the cart. You pay {totalValue > 0 ? Math.round((myItemsTotal / totalValue) * 100) : 0}% of the shared {isUnlocked ? 'platform charges' : 'fees'} (₹{sharedFees}).
                {isUnlocked ? (
                  <span className="text-shippy-green block mt-1">🎉 You saved ₹15 on delivery charges because the target cart was unlocked!</span>
                ) : (
                  <span className="text-shippy-orange block mt-1">⚠️ Cart is below target threshold. Unlocking reduces delivery fee by ₹30.</span>
                )}
              </div>
            </div>
          )}

          {/* Action Area */}
          <div className="p-4 flex gap-3 bg-white">
            {myParticipant.paymentStatus === 'paid' ? (
              <div className="w-full bg-shippy-green/10 border border-shippy-green/30 text-shippy-green font-bold py-3.5 px-6 rounded-2xl text-center text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>You're in. Your cart is locked. 🔒</span>
              </div>
            ) : (
              <button
                onClick={() => {
                  setPaymentStep('options');
                  setShowPaymentModal(true);
                }}
                className="w-full bg-shippy-orange hover:bg-shippy-orange/95 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xs text-sm flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                CHECKOUT & PAY SHARE (₹{myGrandTotal})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Join Request Drawer */}
      <AnimatePresence>
        {showJoinRequestDrawer && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-end md:items-center justify-center z-50">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white rounded-t-[32px] md:rounded-[32px] w-full max-w-md md:max-w-lg p-6 max-h-[85%] md:max-h-[80%] flex flex-col border-t md:border border-shippy-border shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-extrabold text-shippy-charcoal">Add items to Shippy</h3>
                <button onClick={() => setShowJoinRequestDrawer(false)} className="text-shippy-brown hover:text-shippy-charcoal">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {/* Form to add item */}
                <form onSubmit={handleAddJoinItem} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Kurkure"
                    value={joinItemName}
                    onChange={(e) => setJoinItemName(e.target.value)}
                    className="flex-1 bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="₹"
                    value={joinItemPrice}
                    onChange={(e) => setJoinItemPrice(e.target.value)}
                    className="w-16 bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
                  />
                  <button type="submit" className="bg-shippy-charcoal hover:bg-shippy-brown text-white p-2 rounded-xl">
                    <Plus className="w-4 h-4" />
                  </button>
                </form>

                {/* Items list */}
                {joinItems.length === 0 ? (
                  <div className="border border-dashed border-shippy-border rounded-2xl p-4 text-center text-xs font-semibold text-shippy-brown/50">
                    No items added yet.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {joinItems.map((it, idx) => (
                      <div key={idx} className="flex justify-between text-xs font-semibold bg-shippy-bg px-3 py-2 rounded-xl text-shippy-charcoal">
                        <span>{it.name}</span>
                        <span>₹{it.price}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Drop Point Location */}
                <div>
                  <label className="block text-xs font-bold text-shippy-charcoal mb-1">Your exact drop point / room</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hostel A Room 402"
                    value={joinDropPoint}
                    onChange={(e) => setJoinDropPoint(e.target.value)}
                    className="w-full bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2.5 text-xs font-bold text-shippy-charcoal focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={submitJoinRequest}
                className="w-full bg-shippy-orange hover:bg-shippy-orange/95 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xs text-sm"
              >
                SUBMIT JOIN REQUEST 🚀
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Payment Simulator Popup */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden border border-shippy-border shadow-2xl p-6 relative text-center"
            >
              {paymentStep === 'options' && (
                <div>
                  <div className="w-12 h-12 bg-shippy-orange/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-shippy-orange">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-shippy-charcoal">UPI Payment Gateway</h3>
                  <p className="text-xs text-shippy-brown font-semibold mt-1">Paying Riya (Shippy Organizer)</p>
                  
                  <div className="my-6 bg-shippy-bg rounded-2xl p-4 border border-shippy-border/40">
                    <span className="text-xs font-bold text-shippy-brown block mb-1">GRAND TOTAL</span>
                    <span className="text-2xl font-extrabold text-shippy-charcoal">₹{myGrandTotal}</span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <label className="flex items-center justify-between p-3 border border-shippy-border rounded-xl cursor-pointer hover:bg-shippy-bg">
                      <div className="flex items-center gap-2 text-xs font-bold text-shippy-charcoal">
                        <span className="w-4 h-4 rounded-full bg-[#34A853] text-white flex items-center justify-center font-bold text-[8px]">G</span>
                        Google Pay
                      </div>
                      <input 
                        type="radio" 
                        name="upi" 
                        checked={selectedUPI === 'gpay'} 
                        onChange={() => setSelectedUPI('gpay')} 
                        className="text-shippy-orange focus:ring-shippy-orange"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 border border-shippy-border rounded-xl cursor-pointer hover:bg-shippy-bg">
                      <div className="flex items-center gap-2 text-xs font-bold text-shippy-charcoal">
                        <span className="w-4 h-4 rounded-full bg-[#5f259f] text-white flex items-center justify-center font-bold text-[8px]">P</span>
                        PhonePe
                      </div>
                      <input 
                        type="radio" 
                        name="upi" 
                        checked={selectedUPI === 'phonepe'} 
                        onChange={() => setSelectedUPI('phonepe')}
                        className="text-shippy-orange focus:ring-shippy-orange"
                      />
                    </label>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 bg-shippy-bg hover:bg-shippy-cream text-shippy-charcoal font-bold py-2.5 rounded-xl text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSimulatePayment}
                      className="flex-1 bg-shippy-orange hover:bg-shippy-orange/95 text-white font-bold py-2.5 rounded-xl text-xs"
                    >
                      PAY NOW
                    </button>
                  </div>
                </div>
              )}

              {paymentStep === 'processing' && (
                <div className="py-6 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-4 border-shippy-orange border-t-transparent animate-spin mb-4" />
                  <h4 className="text-sm font-bold text-shippy-charcoal mb-1">Securing payment...</h4>
                  <p className="text-[10px] text-shippy-brown font-semibold uppercase tracking-wider">Contacting UPI Server</p>
                </div>
              )}

              {paymentStep === 'success' && (
                <div className="py-4">
                  <div className="w-12 h-12 bg-shippy-green/10 rounded-full flex items-center justify-center mx-auto mb-4 text-shippy-green">
                    <Check className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-shippy-charcoal">Payment Successful!</h3>
                  <p className="text-xs text-shippy-brown font-semibold mt-1">You're in. Your cart is locked. 🔒</p>
                  
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full bg-shippy-charcoal hover:bg-shippy-brown text-white font-bold py-2.5 rounded-xl text-xs mt-6"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
