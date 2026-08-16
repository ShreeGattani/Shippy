import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Compass, Map, Plus, User, Bell } from 'lucide-react';
import { Login } from './components/Login';
import { HomeFeed } from './components/HomeFeed';
import { Radar } from './components/Radar';
import { CampusMap } from './components/CampusMap';
import { CreateOrder } from './components/CreateOrder';
import { OrderRoom } from './components/OrderRoom';
import { Profile } from './components/Profile';
import { API_BASE } from './config';
import type { Order, User as UserType, ShippyNotification } from './types';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'feed' | 'radar' | 'map' | 'profile'>('feed');
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<ShippyNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(true);

  // Check localStorage for active session on boot
  useEffect(() => {
    const cachedUser = localStorage.getItem('shippy_user');
    if (cachedUser) {
      try {
        setCurrentUser(JSON.parse(cachedUser));
      } catch (e) {
        localStorage.removeItem('shippy_user');
      }
    }
  }, []);

  // Fetch active orders from backend
  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (e) {
      console.error('Error fetching orders:', e);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchOrders();

    // Set up polling interval to fetch orders periodically
    const interval = setInterval(fetchOrders, 8000);

    // Load mock notification feed matching brand tone
    setNotifications([
      { id: 'n_1', text: '🔥 Someone nearby is starting a Blinkit order!', time: 'Just now', type: 'alert' },
      { id: 'n_2', text: '⚡ You saved ₹28 on delivery fees using Shippy!', time: '10 min ago', type: 'success' },
      { id: 'n_3', text: '👀 Shree accepted Arjun\'s items to their cart.', time: '1 hr ago', type: 'info' }
    ]);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLoginSuccess = (user: UserType) => {
    setCurrentUser(user);
    setActiveTab('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem('shippy_user');
    setCurrentUser(null);
    setActiveOrderId(null);
  };

  const handleOrderCreated = (orderId: string) => {
    fetchOrders();
    setActiveOrderId(orderId);
  };

  const handleSelectOrder = (orderId: string) => {
    setActiveOrderId(orderId);
  };

  // Mark all notifications as read when opening drawer
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    setUnreadNotifications(false);
  };

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="w-full max-w-md md:max-w-none mx-auto min-h-screen md:h-screen bg-shippy-bg shadow-2xl md:shadow-none relative flex flex-col md:flex-row noise-bg select-none overflow-hidden">
      
      {/* Laptop/Desktop Left Sidebar Navigation (hidden on mobile) */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-shippy-border/80 p-6 justify-between z-10">
        <div className="space-y-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-shippy-orange flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              S
            </div>
            <span className="font-extrabold text-xl tracking-tight text-shippy-charcoal">SHIPPY</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <button 
              onClick={() => setActiveTab('feed')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                activeTab === 'feed' 
                  ? 'bg-shippy-orange/10 text-shippy-orange' 
                  : 'text-shippy-brown/70 hover:bg-shippy-cream/60 hover:text-shippy-charcoal'
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home Feed</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('radar')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                activeTab === 'radar' 
                  ? 'bg-shippy-orange/10 text-shippy-orange' 
                  : 'text-shippy-brown/70 hover:bg-shippy-cream/60 hover:text-shippy-charcoal'
              }`}
            >
              <Compass className="w-5 h-5" />
              <span>Radar Scan</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                activeTab === 'map' 
                  ? 'bg-shippy-orange/10 text-shippy-orange' 
                  : 'text-shippy-brown/70 hover:bg-shippy-cream/60 hover:text-shippy-charcoal'
              }`}
            >
              <Map className="w-5 h-5" />
              <span>Campus Map</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-xs font-extrabold tracking-wide uppercase transition-all ${
                activeTab === 'profile' 
                  ? 'bg-shippy-orange/10 text-shippy-orange' 
                  : 'text-shippy-brown/70 hover:bg-shippy-cream/60 hover:text-shippy-charcoal'
              }`}
            >
              <User className="w-5 h-5" />
              <span>My Profile</span>
            </button>
          </nav>
        </div>

        {/* Start Cart & User summary block */}
        <div className="space-y-4">
          <button
            onClick={() => {
              const overlay = document.getElementById('create-order-overlay');
              if (overlay) overlay.style.display = 'flex';
            }}
            className="w-full bg-shippy-orange hover:bg-shippy-orange/95 text-white font-extrabold py-3.5 rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 text-xs uppercase tracking-wider cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Start Cart</span>
          </button>

          <div className="bg-shippy-bg border border-shippy-border/60 p-3 rounded-2xl flex items-center gap-3">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-8.5 h-8.5 rounded-full object-cover border border-shippy-border/60" />
            <div className="overflow-hidden">
              <div className="text-xs font-extrabold text-shippy-charcoal truncate">{currentUser.name.split(' ')[0]}</div>
              <div className="text-[10px] text-shippy-brown/60 font-extrabold truncate">📍 {currentUser.hostel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Header (Visible ONLY on mobile) */}
      {!activeOrderId && (
        <div className="md:hidden bg-white border-b border-shippy-border/80 px-5 py-4 flex items-center justify-between z-10 shadow-3xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-shippy-orange flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
              S
            </div>
            <span className="font-extrabold text-base tracking-tight text-shippy-charcoal">SHIPPY</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-shippy-cream px-3 py-1 rounded-full text-[10px] font-bold text-shippy-charcoal border border-shippy-border/50">
              📍 {currentUser.hostel}
            </div>

            {/* Notification Bell */}
            <button 
              onClick={toggleNotifications}
              className="w-8 h-8 rounded-full bg-shippy-bg hover:bg-shippy-cream flex items-center justify-center text-shippy-brown/80 relative"
            >
              <Bell className="w-4.5 h-4.5" />
              {unreadNotifications && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-shippy-orange rounded-full border border-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main View Container (For Mobile viewports) */}
      <div className="flex-1 md:hidden flex flex-col overflow-hidden relative">
        {activeOrderId ? (
          <OrderRoom 
            orderId={activeOrderId} 
            currentUser={currentUser} 
            onBack={() => {
              setActiveOrderId(null);
              fetchOrders();
            }} 
          />
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'feed' && (
              <HomeFeed 
                orders={orders} 
                currentUser={currentUser} 
                onSelectOrder={handleSelectOrder}
                onStartOrderClick={() => {
                  const overlay = document.getElementById('create-order-overlay');
                  if (overlay) overlay.style.display = 'flex';
                }}
              />
            )}
            {activeTab === 'radar' && (
              <Radar 
                orders={orders} 
                currentUser={currentUser} 
                onSelectOrder={handleSelectOrder}
                onStartOrderClick={() => {
                  const overlay = document.getElementById('create-order-overlay');
                  if (overlay) overlay.style.display = 'flex';
                }}
              />
            )}
            {activeTab === 'map' && (
              <CampusMap 
                orders={orders} 
                onSelectOrder={handleSelectOrder}
              />
            )}
            {activeTab === 'profile' && (
              <Profile 
                currentUser={currentUser} 
                onLogout={handleLogout} 
              />
            )}
          </div>
        )}
      </div>

      {/* Laptop/Desktop Main Workspace Layout (hidden on mobile) */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* Central View Content Pane */}
        <div className="flex-1 flex flex-col overflow-hidden border-r border-shippy-border/80">
          {activeTab === 'feed' && (
            <HomeFeed 
              orders={orders} 
              currentUser={currentUser} 
              onSelectOrder={handleSelectOrder}
              onStartOrderClick={() => {
                const overlay = document.getElementById('create-order-overlay');
                if (overlay) overlay.style.display = 'flex';
              }}
            />
          )}
          {activeTab === 'radar' && (
            <Radar 
              orders={orders} 
              currentUser={currentUser} 
              onSelectOrder={handleSelectOrder}
              onStartOrderClick={() => {
                const overlay = document.getElementById('create-order-overlay');
                if (overlay) overlay.style.display = 'flex';
              }}
            />
          )}
          {activeTab === 'map' && (
            <CampusMap 
              orders={orders} 
              onSelectOrder={handleSelectOrder}
            />
          )}
          {activeTab === 'profile' && (
            <Profile 
              currentUser={currentUser} 
              onLogout={handleLogout} 
            />
          )}
        </div>

        {/* Right Details / Live Activity / Chat Pane */}
        <div className="w-[380px] lg:w-[420px] bg-white flex flex-col overflow-hidden relative">
          {activeOrderId ? (
            <OrderRoom 
              orderId={activeOrderId} 
              currentUser={currentUser} 
              onBack={() => {
                setActiveOrderId(null);
                fetchOrders();
              }} 
            />
          ) : (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6 noise-bg">
              {/* Desktop Header */}
              <div className="flex items-center justify-between pb-4 border-b border-shippy-border/60">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-shippy-orange">Shiv Nadar University</span>
                  <h3 className="text-base font-extrabold text-shippy-charcoal mt-0.5">Campus Activity</h3>
                </div>
                <div className="bg-shippy-green/10 text-shippy-green text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                  ● Live updates
                </div>
              </div>

              {/* Campus Savings Summary widget */}
              <div className="bg-[#FFF8F5] border border-shippy-orange/15 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-shippy-orange/70 block">Total Campus Savings</span>
                  <div className="text-xl font-extrabold text-shippy-charcoal mt-0.5">₹4,290 Saved</div>
                  <p className="text-[10px] text-shippy-brown/70 font-semibold mt-1 max-w-[200px]">
                    SNU students saved over ₹4k in delivery fees this week!
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-shippy-orange/10 flex items-center justify-center text-shippy-orange font-bold text-lg">
                  🎉
                </div>
              </div>

              {/* Interactive Info Widget */}
              <div className="bg-white border border-shippy-border/60 rounded-2xl p-4 space-y-2.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-shippy-brown/60 block">Shippy Tips</span>
                <div className="text-xs font-bold text-shippy-charcoal">
                  💡 Start group carts early!
                </div>
                <p className="text-[10px] text-shippy-brown/70 leading-normal">
                  Opening a group cart 20-30 minutes before you intend to check out gives nearby hostel mates plenty of time to find and join your order.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Notification Slide-over (Visible on Mobile only) */}
      <AnimatePresence>
        {showNotifications && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-3xs z-30 flex justify-end md:hidden">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-80 bg-white border-l border-shippy-border h-full p-5 flex flex-col shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60">Notifications</span>
                <button onClick={toggleNotifications} className="text-shippy-brown hover:text-shippy-charcoal font-bold text-sm">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3.5">
                {notifications.map((notif) => (
                  <div key={notif.id} className="bg-shippy-bg border border-shippy-border/70 p-3.5 rounded-2xl flex items-start gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-shippy-orange mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-shippy-charcoal leading-relaxed">{notif.text}</p>
                      <span className="text-[9px] font-bold text-shippy-brown/50 block mt-1">{notif.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation Bar (Hidden inside Order Room, and ALWAYS hidden on desktop) */}
      {!activeOrderId && (
        <div className="md:hidden absolute bottom-0 inset-x-0 bg-white/95 border-t border-shippy-border/80 px-6 py-3 flex items-center justify-between z-20 shadow-lg">
          <button 
            onClick={() => setActiveTab('feed')} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'feed' ? 'text-shippy-orange' : 'text-shippy-brown/50 hover:text-shippy-brown'}`}
          >
            <Home className="w-5.5 h-5.5" />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('radar')} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'radar' ? 'text-shippy-orange' : 'text-shippy-brown/50 hover:text-shippy-brown'}`}
          >
            <Compass className="w-5.5 h-5.5" />
            <span className="text-[10px] font-bold">Radar</span>
          </button>

          {/* Special prominent middle button to CREATE a Shippy Cart */}
          <div className="relative -top-5">
            <span className="animate-ping-slow absolute inset-0 rounded-full bg-shippy-orange/20 pointer-events-none" />
            
            <button
              onClick={() => {
                const overlay = document.getElementById('create-order-overlay');
                if (overlay) overlay.style.display = 'flex';
              }}
              className="w-13 h-13 rounded-full bg-shippy-orange hover:bg-shippy-orange/95 text-white flex items-center justify-center shadow-lg border-2 border-white focus:outline-none transition-transform active:scale-95"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('map')} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'map' ? 'text-shippy-orange' : 'text-shippy-brown/50 hover:text-shippy-brown'}`}
          >
            <Map className="w-5.5 h-5.5" />
            <span className="text-[10px] font-bold">Map</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'profile' ? 'text-shippy-orange' : 'text-shippy-brown/50 hover:text-shippy-brown'}`}
          >
            <User className="w-5.5 h-5.5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      )}

      {/* Floating Create Order Overlay */}
      <div 
        id="create-order-overlay" 
        style={{ display: 'none' }}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs items-end md:items-center justify-center z-40"
      >
        <div className="bg-white rounded-t-[32px] md:rounded-[32px] w-full max-w-md md:max-w-lg h-[90%] md:h-[80%] flex flex-col shadow-2xl border-t md:border border-shippy-border overflow-hidden">
          <CreateOrder 
            currentUser={currentUser} 
            onOrderCreated={(orderId) => {
              const overlay = document.getElementById('create-order-overlay');
              if (overlay) overlay.style.display = 'none';
              handleOrderCreated(orderId);
            }} 
            onCancel={() => {
              const overlay = document.getElementById('create-order-overlay');
              if (overlay) overlay.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
