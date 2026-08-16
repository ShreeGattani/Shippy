import React from 'react';
import { Shield, Landmark, PiggyBank, History, LogOut } from 'lucide-react';
import type { User } from '../types';

interface ProfileProps {
  currentUser: User;
  onLogout: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ currentUser, onLogout }) => {
  // Pre-configured mock history for realistic experience
  const mockHistory = [
    { id: 'h_1', platform: 'Blinkit', date: 'Yesterday', items: 'Maggi, Coca Cola', cost: 136, savings: 28 },
    { id: 'h_2', platform: 'Blinkit', date: '3 days ago', items: 'Bread, Butter, Eggs', cost: 210, savings: 35 },
    { id: 'h_3', platform: 'Blinkit', date: 'Last week', items: 'Wai Wai Noodles, Chips', cost: 95, savings: 20 }
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 noise-bg">
      {/* Title */}
      <div className="py-6">
        <h2 className="text-4xl font-extrabold tracking-tight text-shippy-charcoal leading-none">
          My Profile
        </h2>
      </div>

      <div className="space-y-6">
        {/* User Card */}
        <div className="bg-white border border-shippy-border/95 rounded-[32px] p-6 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-shippy-orange/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-shippy-border">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-shippy-charcoal leading-tight">{currentUser.name}</h3>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="flex items-center gap-1 bg-shippy-green/10 text-shippy-green px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                  <Shield className="w-3 h-3 text-shippy-green" fill="currentColor" fillOpacity={0.1} />
                  <span>Verified SNU Student</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 border-t border-shippy-border/40 pt-4 text-xs font-bold text-shippy-brown">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-shippy-brown/60" />
              <div>
                <span className="block text-[10px] text-shippy-brown/50">LOCATION</span>
                <span className="text-shippy-charcoal font-extrabold">{currentUser.hostel}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-shippy-brown/60" />
              <div>
                <span className="block text-[10px] text-shippy-brown/50">RELIABILITY</span>
                <span className="text-shippy-green font-extrabold">{currentUser.reliability}% Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Tracker Card */}
        <div className="bg-[#FFF8F5] border-2 border-shippy-orange/15 rounded-[32px] p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-shippy-orange/10 rounded-2xl flex items-center justify-center text-shippy-orange">
              <PiggyBank className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-shippy-orange/70 block">Shippy Savings</span>
              <span className="text-2xl font-extrabold text-shippy-charcoal">₹{currentUser.savings + 83}</span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold bg-shippy-green/10 text-shippy-green px-2.5 py-1 rounded-full uppercase tracking-wider">
            ↑ 14% this month
          </span>
        </div>

        {/* Recent Orders History */}
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 block mb-3 px-1">Recent Shippys</span>
          <div className="space-y-2">
            {mockHistory.map((item) => (
              <div key={item.id} className="bg-white border border-shippy-border/80 p-4 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-shippy-cream flex items-center justify-center text-shippy-brown text-xs">
                    <History className="w-4.5 h-4.5 text-shippy-brown/70" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-shippy-charcoal leading-none mb-1">
                      {item.platform} ({item.date})
                    </div>
                    <span className="text-[10px] text-shippy-brown/60 font-semibold block truncate max-w-[200px]">
                      {item.items}
                    </span>
                  </div>
                </div>
                
                <div className="text-right">
                  <span className="text-xs font-extrabold text-shippy-charcoal block">₹{item.cost}</span>
                  <span className="text-[9px] font-bold text-shippy-green block">Saved ₹{item.savings}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          className="w-full bg-white border border-shippy-border hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-shippy-brown font-bold py-3.5 px-6 rounded-2xl shadow-2xs text-xs flex items-center justify-center gap-2 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>LOGOUT FROM SHIPPY</span>
        </button>
      </div>
    </div>
  );
};
