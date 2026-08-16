import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ShoppingBag, ArrowRight, X, Users } from 'lucide-react';
import type { Order } from '../types';

interface CampusMapProps {
  orders: Order[];
  onSelectOrder: (orderId: string) => void;
}

interface LocationPin {
  id: string;
  name: string;
  x: number; // percentage coordinate
  y: number; // percentage coordinate
  color: string;
}

export const CampusMap: React.FC<CampusMapProps> = ({ orders, onSelectOrder }) => {
  const [selectedLocation, setSelectedLocation] = useState<LocationPin | null>(null);

  const locations: LocationPin[] = [
    { id: 'hostel_a', name: 'Hostel A', x: 25, y: 25, color: '#E06A3B' },
    { id: 'hostel_b', name: 'Hostel B', x: 75, y: 30, color: '#E06A3B' },
    { id: 'hostel_c', name: 'Hostel C', x: 30, y: 70, color: '#E06A3B' },
    { id: 'library', name: 'Library', x: 50, y: 50, color: '#47825E' },
    { id: 'main_gate', name: 'Main Gate', x: 50, y: 85, color: '#3E3830' }
  ];

  // Count active orders for each location
  const getOrdersAtLocation = (locName: string) => {
    return orders.filter(o => 
      o.status === 'active' && 
      (o.dropLocation.toLowerCase().includes(locName.toLowerCase()) || 
       o.creator.hostel.toLowerCase().includes(locName.toLowerCase()))
    );
  };

  const getOrderStats = (order: Order) => {
    const accepted = order.participants.filter(p => p.status === 'accepted');
    const total = accepted.reduce((sum, p) => sum + p.items.reduce((iSum, i) => iSum + i.price * i.quantity, 0), 0);
    return {
      total,
      percentage: Math.min(Math.round((total / order.targetValue) * 100), 100),
      needed: Math.max(order.targetValue - total, 0)
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden noise-bg relative">
      {/* Title */}
      <div className="px-4 pt-4 pb-2 z-10">
        <h2 className="text-4xl font-extrabold tracking-tight text-shippy-charcoal leading-none">
          Campus Map
        </h2>
        <p className="text-sm text-shippy-brown font-semibold mt-2">
          Real-time group delivery map of Shiv Nadar University.
        </p>
      </div>

      {/* 2D Map Container */}
      <div className="flex-1 m-4 border-2 border-shippy-border/80 bg-[#F4F0EA] rounded-[32px] overflow-hidden relative shadow-xs flex items-center justify-center">
        {/* Map Grid Gridlines */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none">
          {Array.from({ length: 36 }).map((_, i) => (
            <div key={i} className="border border-shippy-brown/30" />
          ))}
        </div>

        {/* Campus Map SVG Pathways */}
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Main roads */}
          <path d="M 0,250 C 250,250 250,500 500,500 C 750,500 750,850 1000,850" fill="none" stroke="#3E3830" strokeWidth="12" strokeLinecap="round" />
          <path d="M 250,0 L 250,1000" fill="none" stroke="#3E3830" strokeWidth="8" />
          <path d="M 750,0 L 750,1000" fill="none" stroke="#3E3830" strokeWidth="8" />
          <circle cx="500" cy="500" r="120" fill="none" stroke="#3E3830" strokeWidth="6" strokeDasharray="10 8" />
        </svg>

        {/* Location Markers */}
        {locations.map((loc) => {
          const locOrders = getOrdersAtLocation(loc.name);
          const hasOrders = locOrders.length > 0;

          return (
            <div
              key={loc.id}
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
            >
              {/* Pulsing Beacon for active orders */}
              {hasOrders && (
                <div className="absolute -inset-4 flex items-center justify-center pointer-events-none">
                  <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-shippy-orange opacity-40"></span>
                  <span className="animate-pulse absolute inline-flex h-12 w-12 rounded-full bg-shippy-orange opacity-15"></span>
                </div>
              )}

              {/* Beacon Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedLocation(loc)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md border ${
                  hasOrders 
                    ? 'bg-shippy-orange text-white border-shippy-orange/50' 
                    : 'bg-white text-shippy-brown border-shippy-border'
                }`}
              >
                {hasOrders ? (
                  <span className="font-extrabold text-sm">{locOrders.length}</span>
                ) : (
                  <MapPin className="w-5 h-5" />
                )}
              </motion.button>

              {/* Location Label */}
              <div className="bg-white border border-shippy-border/80 px-2 py-0.5 rounded-full mt-1.5 shadow-xs">
                <span className="text-[10px] font-bold text-shippy-charcoal leading-none block whitespace-nowrap">
                  {loc.name}
                </span>
              </div>
            </div>
          );
        })}

        {/* Campus Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 border border-shippy-border/80 px-3.5 py-2 rounded-2xl text-[10px] font-bold text-shippy-brown shadow-xs flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-shippy-orange inline-block" />
            <span>Active Carts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-shippy-border inline-block" />
            <span>Empty Hub</span>
          </div>
        </div>
      </div>

      {/* Bottom Drawer for Selected Location Orders */}
      <AnimatePresence>
        {selectedLocation && (() => {
          const locOrders = getOrdersAtLocation(selectedLocation.name);

          return (
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 bg-white border-t border-shippy-border rounded-t-[32px] p-6 z-20 shadow-2xl flex flex-col max-h-[50%]"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xl font-extrabold text-shippy-charcoal">{selectedLocation.name}</h3>
                  <p className="text-xs font-bold text-shippy-brown/60">
                    {locOrders.length} Blinkit order{locOrders.length !== 1 ? 's' : ''} here
                  </p>
                </div>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="w-8 h-8 rounded-full bg-shippy-bg hover:bg-shippy-cream flex items-center justify-center text-shippy-brown"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Orders list */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {locOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-8 h-8 text-shippy-brown/30 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-shippy-brown">No active group orders at {selectedLocation.name}.</p>
                  </div>
                ) : (
                  locOrders.map(order => {
                    const { percentage, needed } = getOrderStats(order);
                    
                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          onSelectOrder(order.id);
                          setSelectedLocation(null);
                        }}
                        className="bg-shippy-bg border border-shippy-border/80 hover:border-shippy-orange/50 p-4 rounded-2xl flex items-center justify-between cursor-pointer transition-colors"
                      >
                        <div className="flex-1 pr-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-xs font-extrabold text-shippy-charcoal">
                              Cart by {order.creator.name.split(' ')[0]}
                            </span>
                            <span className="text-[9px] font-bold bg-shippy-orange/10 text-shippy-orange px-1.5 py-0.5 rounded-full">
                              ₹{needed} Needed
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-shippy-brown/60 mb-2">
                            <Users className="w-3 h-3" />
                            <span>{order.participants.filter(p => p.status === 'accepted').length} joined</span>
                            <span>•</span>
                            <span>Drop: {order.dropLocation}</span>
                          </div>

                          <div className="w-full bg-shippy-cream h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-shippy-orange" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                        
                        <ArrowRight className="w-4 h-4 text-shippy-orange" />
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
};
