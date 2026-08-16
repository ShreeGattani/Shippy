import React, { useState } from 'react';
import { Plus, Trash, Sparkles, MapPin, IndianRupee, ShoppingBag } from 'lucide-react';
import { API_BASE } from '../config';
import type { User, Item } from '../types';

interface CreateOrderProps {
  currentUser: User;
  onOrderCreated: (orderId: string) => void;
  onCancel: () => void;
}

export const CreateOrder: React.FC<CreateOrderProps> = ({ currentUser, onOrderCreated, onCancel }) => {
  const [targetValue, setTargetValue] = useState(160);
  const [dropLocation, setDropLocation] = useState(currentUser.hostel + ' Lobby');
  const [items, setItems] = useState<Item[]>([]);
  
  // Item form inputs
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemPrice) return;
    
    const priceNum = parseFloat(itemPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorMessage('Please enter a valid price');
      return;
    }

    setItems([...items, { name: itemName, price: priceNum, quantity: 1 }]);
    setItemName('');
    setItemPrice('');
    setErrorMessage(null);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const getCreatorTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleSubmit = async () => {
    if (!dropLocation) {
      setErrorMessage('Please enter a general drop location.');
      return;
    }
    
    if (items.length === 0) {
      setErrorMessage('Please add at least one item to your cart before starting a Shippy order.');
      return;
    }

    if (targetValue < 100) {
      setErrorMessage('Target cart size must be at least ₹100.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create order
      const orderRes = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          targetValue,
          dropLocation
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setErrorMessage(orderData.error || 'Failed to create order');
        setIsSubmitting(false);
        return;
      }

      // 2. Add creator's items (if any)
      if (items.length > 0) {
        const itemsRes = await fetch(`${API_BASE}/orders/${orderData.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: currentUser.email,
            items
          })
        });
        
        if (!itemsRes.ok) {
          console.error('Failed to attach items');
        }
      }

      setIsSubmitting(false);
      onOrderCreated(orderData.id);
    } catch (err) {
      setErrorMessage('Server connection error. Please try again.');
      setIsSubmitting(false);
    }
  };

  const totalValue = getCreatorTotal();
  const percentage = Math.min(Math.round((totalValue / targetValue) * 100), 100);
  const needed = Math.max(targetValue - totalValue, 0);

  return (
    <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 md:pb-8 noise-bg">
      <div className="py-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-shippy-charcoal">
          Start a Shippy
        </h2>
        <p className="text-xs text-shippy-brown font-semibold mt-1">
          Create a Blinkit group order and invite other SNU students to add items.
        </p>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl p-3 mb-4 leading-relaxed">
          {errorMessage}
        </div>
      )}

      <div className="space-y-5">
        {/* Step 1: Settings */}
        <div className="bg-white border border-shippy-border/90 rounded-3xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 mb-4">Cart Settings</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-shippy-charcoal mb-1">Target Cart Value (Threshold)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-shippy-brown/60" />
                <input
                  type="number"
                  placeholder="e.g. 160"
                  value={targetValue}
                  onChange={(e) => setTargetValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-shippy-bg border border-shippy-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-shippy-charcoal focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
                />
              </div>
              <span className="text-[10px] text-shippy-brown/60 font-semibold mt-1 block">
                Blinkit offers free shipping / discounts above certain targets. Default is ₹160.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-shippy-charcoal mb-1">General Drop-off Location</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-shippy-brown/60" />
                <input
                  type="text"
                  placeholder="e.g. Hostel A Lobby, Library Reception"
                  value={dropLocation}
                  onChange={(e) => setDropLocation(e.target.value)}
                  className="w-full bg-shippy-bg border border-shippy-border rounded-xl pl-9 pr-4 py-2.5 text-sm font-bold text-shippy-charcoal focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Add your own items */}
        <div className="bg-white border border-shippy-border/90 rounded-3xl p-5 shadow-xs">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-shippy-brown/60 mb-3">Add items to your cart</h3>

          {/* Add Item form */}
          <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Item name (e.g. Maggi)"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="flex-1 bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
            />
            <input
              type="number"
              placeholder="Price (₹)"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              className="w-20 bg-shippy-bg border border-shippy-border rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-shippy-orange/20"
            />
            <button
              type="submit"
              className="bg-shippy-charcoal hover:bg-shippy-brown text-white p-2 rounded-xl"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {/* Added items list */}
          {items.length === 0 ? (
            <div className="border border-dashed border-shippy-border rounded-2xl p-4 text-center text-xs font-medium text-shippy-brown/65">
              Your cart is empty. Add a few items to kickstart progress.
            </div>
          ) : (
            <div className="space-y-2 mb-4">
              {items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-shippy-bg px-3 py-2 rounded-xl text-xs font-semibold text-shippy-charcoal">
                  <span>{item.name}</span>
                  <div className="flex items-center gap-3">
                    <span>₹{item.price}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress towards threshold */}
          <div className="border-t border-shippy-border/40 pt-4 mt-4">
            <div className="flex justify-between text-xs font-bold text-shippy-charcoal mb-1.5">
              <span className="flex items-center gap-1">
                <ShoppingBag className="w-3.5 h-3.5 text-shippy-orange" />
                Your Total: ₹{totalValue}
              </span>
              <span>{percentage}% of Target</span>
            </div>
            
            <div className="w-full bg-shippy-cream h-2 rounded-full overflow-hidden mb-2">
              <div className="h-full bg-shippy-orange" style={{ width: `${percentage}%` }} />
            </div>

            {needed > 0 ? (
              <div className="text-[10px] font-bold text-shippy-brown/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-shippy-orange" />
                <span>Need <strong className="text-shippy-charcoal">₹{needed}</strong> more to unlock this Shippy order.</span>
              </div>
            ) : (
              <div className="text-[10px] font-bold text-shippy-green flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-shippy-green" />
                <span>Boom! You unlocked the target cart size! 🎉</span>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-white border border-shippy-border hover:bg-shippy-bg text-shippy-charcoal font-bold py-3.5 px-6 rounded-2xl shadow-xs text-sm"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={`flex-1 bg-shippy-orange hover:bg-shippy-orange/90 text-white font-bold py-3.5 px-6 rounded-2xl shadow-xs text-sm flex items-center justify-center gap-2 ${
              isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Launching...' : 'CREATE SHIPPY 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
};
