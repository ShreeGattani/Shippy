import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, Users, MapPin, ArrowRight, CheckCircle2, Search } from 'lucide-react';
import type { Order, User } from '../types';

interface HomeFeedProps {
  orders: Order[];
  currentUser: User;
  onSelectOrder: (orderId: string) => void;
  onStartOrderClick: () => void;
}

export const HomeFeed: React.FC<HomeFeedProps> = ({ orders, currentUser, onSelectOrder, onStartOrderClick }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHostel, setFilterHostel] = useState('All');
  
  // Calculate total values for orders
  const getOrderStats = (order: Order) => {
    const acceptedParticipants = order.participants.filter(p => p.status === 'accepted');
    const totalValue = acceptedParticipants.reduce((sum, p) => {
      return sum + p.items.reduce((iSum, item) => iSum + item.price * item.quantity, 0);
    }, 0);
    
    const percentage = Math.min(Math.round((totalValue / order.targetValue) * 100), 100);
    const needed = Math.max(order.targetValue - totalValue, 0);
    const isUnlocked = totalValue >= order.targetValue;
    
    return { totalValue, percentage, needed, isUnlocked };
  };

  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.dropLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesHostel = filterHostel === 'All' || o.dropLocation.toLowerCase().includes(filterHostel.toLowerCase()) || o.creator.hostel === filterHostel;
    
    return matchesSearch && matchesHostel;
  });

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24">
      {/* Hero Header */}
      <div className="py-6 mb-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-shippy-charcoal leading-none">
          Don't order alone.
        </h2>
        <p className="text-sm text-shippy-brown font-semibold mt-2 max-w-xs leading-relaxed">
          Find SNU students ordering nearby. Join their Blinkit cart, split fees, and save.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 absolute left-3 top-1/2 -translate-y-1/2 text-shippy-brown/50" />
          <input
            type="text"
            placeholder="Search active carts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-shippy-border/90 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
          />
        </div>
        
        <select
          value={filterHostel}
          onChange={(e) => setFilterHostel(e.target.value)}
          className="bg-white border border-shippy-border/90 rounded-2xl px-3 py-2 text-xs font-bold text-shippy-brown focus:outline-none"
        >
          <option value="All">All Campus</option>
          <option value="Hostel A">Hostel A</option>
          <option value="Hostel B">Hostel B</option>
          <option value="Hostel C">Hostel C</option>
        </select>
      </div>

      {/* Active Orders List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60">Active Shippy Carts</span>
          <span className="text-xs font-bold text-shippy-orange bg-shippy-orange/10 px-2 py-0.5 rounded-full">
            {filteredOrders.length} active
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white border border-shippy-border/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-shippy-brown/30 mb-3" />
            <h3 className="text-base font-bold text-shippy-charcoal mb-1">No Shippys nearby yet.</h3>
            <p className="text-xs text-shippy-brown font-medium max-w-[200px] mb-4">
              Be the first one on campus to start a Blinkit group cart.
            </p>
            <button
              onClick={onStartOrderClick}
              className="bg-shippy-orange hover:bg-shippy-orange/95 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs"
            >
              + START A SHIPPY
            </button>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const { totalValue, percentage, needed, isUnlocked } = getOrderStats(order);
            const isCreator = order.creator.email === currentUser.email;
            const isJoined = order.participants.some(p => p.user.email === currentUser.email && p.status === 'accepted');
            const isPendingApproval = order.pendingRequests.some(p => p.user.email === currentUser.email);

            return (
              <motion.div
                key={order.id}
                layoutId={`order-card-${order.id}`}
                onClick={() => onSelectOrder(order.id)}
                className="bg-white border border-shippy-border/90 hover:border-shippy-brown/40 rounded-3xl p-5 shadow-xs hover:shadow-sm cursor-pointer transition-all relative overflow-hidden"
              >
                {/* Platform Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FFF200] flex items-center justify-center font-extrabold text-[10px] text-black border border-black/10 shadow-xs">
                      blink
                    </div>
                    <div>
                      <span className="text-xs font-bold text-shippy-charcoal tracking-tight">BLINKIT CART</span>
                      <span className="text-[10px] text-shippy-brown/60 block font-bold leading-none">by {order.creator.name.split(' ')[0]}</span>
                    </div>
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 bg-shippy-green/10 text-shippy-green text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" fill="currentColor" fillOpacity={0.1} />
                      Unlocked
                    </span>
                  ) : (
                    <span className="bg-shippy-orange/10 text-shippy-orange text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                      ₹{needed} Needed
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-bold text-shippy-charcoal mb-1.5">
                    <span>₹{totalValue} / ₹{order.targetValue}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="w-full bg-shippy-cream h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${isUnlocked ? 'bg-shippy-green' : 'bg-shippy-orange'}`}
                    />
                  </div>
                </div>

                {/* Details Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-shippy-border/40 text-[11px] font-bold text-shippy-brown/85">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-shippy-brown/60" />
                      {order.dropLocation}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-shippy-brown/60" />
                      {order.participants.filter(p => p.status === 'accepted').length} student{order.participants.filter(p => p.status === 'accepted').length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-shippy-orange">
                    {isCreator ? (
                      <span className="bg-shippy-charcoal text-white text-[9px] px-2 py-0.5 rounded-full">ORGANIZER</span>
                    ) : isJoined ? (
                      <span className="bg-shippy-green/10 text-shippy-green text-[9px] px-2 py-0.5 rounded-full">JOINED</span>
                    ) : isPendingApproval ? (
                      <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full">PENDING</span>
                    ) : (
                      <span className="flex items-center gap-0.5 hover:translate-x-0.5 transition-transform">
                        JOIN ORDER <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
