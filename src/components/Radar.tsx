import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Compass, Sparkles, MapPin, Users } from 'lucide-react';
import type { Order, User } from '../types';

interface RadarProps {
  orders: Order[];
  currentUser: User;
  onSelectOrder: (orderId: string) => void;
  onStartOrderClick: () => void;
}

export const Radar: React.FC<RadarProps> = ({ orders, currentUser, onSelectOrder, onStartOrderClick }) => {
  const [scanning, setScanning] = useState(true);
  const [matchedOrders, setMatchedOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Simulate active scan for 2.5 seconds
    const timer = setTimeout(() => {
      setScanning(false);
      
      // Filter out completed/cancelled/locked/own orders for match recommendation
      const joinable = orders.filter(
        o => o.status === 'active' && 
             o.creator.email !== currentUser.email &&
             !o.participants.some(p => p.user.email === currentUser.email)
      );

      // Sort criteria:
      // 1. Same hostel first
      // 2. Minimum amount needed is low (closer to threshold)
      const sorted = [...joinable].sort((a, b) => {
        const aStats = getOrderNeeded(a);
        const bStats = getOrderNeeded(b);

        const aSameHostel = a.dropLocation.includes(currentUser.hostel) || a.creator.hostel === currentUser.hostel;
        const bSameHostel = b.dropLocation.includes(currentUser.hostel) || b.creator.hostel === currentUser.hostel;

        if (aSameHostel && !bSameHostel) return -1;
        if (!aSameHostel && bSameHostel) return 1;

        return aStats.needed - bStats.needed;
      });

      setMatchedOrders(sorted);
    }, 2500);

    return () => clearTimeout(timer);
  }, [orders, currentUser]);

  const getOrderNeeded = (order: Order) => {
    const total = order.participants
      .filter(p => p.status === 'accepted')
      .reduce((sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
    return {
      total,
      needed: Math.max(order.targetValue - total, 0),
      percentage: Math.min(Math.round((total / order.targetValue) * 100), 100)
    };
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 flex flex-col noise-bg">
      <div className="py-6 mb-2">
        <h2 className="text-4xl font-extrabold tracking-tight text-shippy-charcoal leading-none">
          Shippy Radar
        </h2>
        <p className="text-sm text-shippy-brown font-semibold mt-2">
          Intelligently connecting nearby carts to unlock orders.
        </p>
      </div>

      {scanning ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10">
          <div className="relative w-64 h-64 flex items-center justify-center mb-8">
            {/* Pulsing rings */}
            <motion.div
              animate={{ scale: [1, 1.4], opacity: [0.3, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border-2 border-shippy-orange/30"
            />
            <motion.div
              animate={{ scale: [1, 1.8], opacity: [0.2, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 0.8 }}
              className="absolute inset-0 rounded-full border-2 border-shippy-orange/20"
            />
            <motion.div
              animate={{ scale: [1, 2.2], opacity: [0.1, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeOut', delay: 1.6 }}
              className="absolute inset-0 rounded-full border-2 border-shippy-orange/10"
            />

            {/* Radar Sweep */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="absolute inset-0 rounded-full border border-shippy-border/30 origin-center flex items-center justify-center"
              style={{
                background: 'conic-gradient(from 0deg, rgba(224, 106, 59, 0.15) 0deg, transparent 90deg, transparent 360deg)'
              }}
            />

            {/* Central icon */}
            <div className="w-20 h-20 rounded-full bg-white border border-shippy-border shadow-md flex items-center justify-center z-10">
              <Compass className="w-10 h-10 text-shippy-orange animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            {/* Blips */}
            <motion.div
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
              className="absolute top-12 left-16 w-3 h-3 rounded-full bg-shippy-green shadow-xs shadow-shippy-green"
            />
            <motion.div
              animate={{ opacity: [0.1, 0.8, 0.1] }}
              transition={{ repeat: Infinity, duration: 2.5, delay: 1.2 }}
              className="absolute bottom-16 right-12 w-3.5 h-3.5 rounded-full bg-shippy-orange shadow-xs shadow-shippy-orange"
            />
            <motion.div
              animate={{ opacity: [0.2, 0.9, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.7 }}
              className="absolute top-28 right-20 w-2.5 h-2.5 rounded-full bg-shippy-green shadow-xs shadow-shippy-green"
            />
          </div>

          <h3 className="text-lg font-bold text-shippy-charcoal mb-1">Scanning campus...</h3>
          <p className="text-xs text-shippy-brown font-semibold uppercase tracking-wider">Shiv Nadar University</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="bg-[#F5EFE6] border border-shippy-border/60 rounded-2xl p-4 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-shippy-orange flex-shrink-0" />
            <span className="text-xs font-bold text-shippy-brown leading-relaxed">
              We found <strong className="text-shippy-charcoal">{matchedOrders.length} orders</strong> you can join right now to split delivery fees!
            </span>
          </div>

          {matchedOrders.length === 0 ? (
            <div className="bg-white border border-shippy-border/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center mt-6">
              <Compass className="w-10 h-10 text-shippy-brown/30 mb-3" />
              <h3 className="text-base font-bold text-shippy-charcoal mb-1">No compatible orders.</h3>
              <p className="text-xs text-shippy-brown font-medium max-w-[200px] mb-4">
                Be the first to open a cart and let others find you.
              </p>
              <button
                onClick={onStartOrderClick}
                className="bg-shippy-orange hover:bg-shippy-orange/95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs"
              >
                + START A CART
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 block mb-1">Best Matches</span>
              {matchedOrders.map((order, idx) => {
                const { total, needed, percentage } = getOrderNeeded(order);
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => onSelectOrder(order.id)}
                    className="bg-white border-2 border-shippy-orange/20 hover:border-shippy-orange/60 rounded-3xl p-5 shadow-xs transition-all cursor-pointer relative"
                  >
                    <div className="absolute top-0 right-6 -translate-y-1/2 bg-shippy-orange text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {idx === 0 ? 'Best Match' : 'Nearby'}
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-shippy-border">
                        <img src={order.creator.avatar} alt={order.creator.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="text-sm font-extrabold text-shippy-charcoal">{order.creator.name}</div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-shippy-brown/60">
                          <span>{order.creator.hostel}</span>
                          <span>•</span>
                          <span className="text-shippy-green">★ {order.creator.reliability}% Reliability</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-shippy-bg rounded-2xl p-3 mb-4 border border-shippy-border/40">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-extrabold text-shippy-charcoal">Blinkit Order #{order.id.split('_')[1]}</span>
                        <span className="text-xs font-bold text-shippy-brown">₹{total} / ₹{order.targetValue}</span>
                      </div>
                      
                      <div className="w-full bg-shippy-cream h-2 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-shippy-orange rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      
                      <div className="text-[11px] font-bold text-shippy-brown/80">
                        Only <span className="text-shippy-orange">₹{needed} more</span> needed to unlock free shipping.
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-shippy-brown/70">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-shippy-brown/40" />
                          {order.dropLocation}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-shippy-brown/40" />
                          {order.participants.filter(p => p.status === 'accepted').length} joined
                        </span>
                      </div>
                      <span className="text-shippy-orange flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        JOIN [ ]
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
