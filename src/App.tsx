import React, { useState, useEffect, useMemo } from 'react';
import { Purchase } from './types';
import { getSavedPurchases, savePurchases, formatRupees } from './utils';
import AddPurchaseForm from './components/AddPurchaseForm';
import PurchaseList from './components/PurchaseList';
import PurchaseStats from './components/PurchaseStats';
import PriceTrendChart from './components/PriceTrendChart';
import { ShoppingBasket, Clock, Calendar, Database, ShieldCheck, Heart, Search, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [selectedItemName, setSelectedItemName] = useState<string | null>('Kaju (Cashew Nuts)');
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  
  // Lifted search state for top-header search bar integration
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom date/time filter preset
  const [timeFilter, setTimeFilter] = useState<'all' | '7days' | '30days'>('all');

  // Load purchases initially
  useEffect(() => {
    setPurchases(getSavedPurchases());
  }, []);

  // Update localStorage when purchases change
  const handleSetPurchases = (newPurchases: Purchase[]) => {
    setPurchases(newPurchases);
    savePurchases(newPurchases);
  };

  // Add new purchase
  const handleAddPurchase = (purchaseData: Omit<Purchase, 'id'>) => {
    const newPurchase: Purchase = {
      ...purchaseData,
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    const updated = [newPurchase, ...purchases];
    handleSetPurchases(updated);
    
    // Auto focus the added item in the trend graph!
    setSelectedItemName(newPurchase.itemName);
  };

  // Update existing purchase
  const handleUpdatePurchase = (id: string, updatedData: Omit<Purchase, 'id'>) => {
    const updated = purchases.map((p) => (p.id === id ? { ...p, ...updatedData } : p));
    handleSetPurchases(updated);
    setEditingPurchase(null);

    // Auto focus the updated item in the trend graph!
    setSelectedItemName(updatedData.itemName);
  };

  // Delete purchase
  const handleDeletePurchase = (id: string) => {
    const updated = purchases.filter((p) => p.id !== id);
    handleSetPurchases(updated);

    // Reset selection if the deleted purchase item has no other records left
    const deletedItemName = purchases.find((p) => p.id === id)?.itemName;
    if (deletedItemName) {
      const remainingWithSameName = updated.some(
        (p) => p.itemName.toLowerCase() === deletedItemName.toLowerCase()
      );
      if (!remainingWithSameName && selectedItemName?.toLowerCase() === deletedItemName.toLowerCase()) {
        setSelectedItemName(null);
      }
    }
  };

  const handleEditInit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    // Scroll to form smoothly on small screens
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Calculate total spent this month for the Header widget
  const totalSpentThisMonth = useMemo(() => {
    const currentYearMonth = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    return purchases
      .filter((p) => p.date.startsWith(currentYearMonth))
      .reduce((sum, p) => sum + p.totalPrice, 0);
  }, [purchases]);

  // Apply time-based filter AND search-based filter for global dashboard sync
  const globallyFilteredPurchases = useMemo(() => {
    // 1. First, apply search filter
    let result = purchases;
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      result = result.filter((p) => 
        p.itemName.toLowerCase().includes(query) ||
        (p.notes && p.notes.toLowerCase().includes(query)) ||
        p.unit.toLowerCase().includes(query)
      );
    }

    // 2. Then, apply time-based filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      if (timeFilter === '7days') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (timeFilter === '30days') {
        cutoffDate.setDate(now.getDate() - 30);
      }
      result = result.filter((p) => new Date(p.date) >= cutoffDate);
    }
    
    return result;
  }, [purchases, searchQuery, timeFilter]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-x-hidden lg:h-screen lg:overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      
      {/* Header section (Sleek layout matching Design HTML) */}
      <header className="h-auto py-4 lg:py-0 lg:h-20 bg-white border-b border-slate-200 px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-4 flex-shrink-0 z-10 shadow-xs">
        {/* Brand identity */}
        <div className="flex items-center space-x-3 w-full lg:w-auto justify-between lg:justify-start">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-150">
              <ShoppingBasket className="w-5.5 h-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5">
                <span>PurchaseLog</span>
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-mono">PRO</span>
              </h1>
            </div>
          </div>
          
          {/* Quick info badges for local storage */}
          <div className="flex lg:hidden items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg text-[9px] font-mono text-slate-500">
            <Database className="w-3 h-3 text-indigo-500" />
            <span>Local DB</span>
          </div>
        </div>

        {/* Dynamic Search Bar (Centered) */}
        <div className="flex-1 max-w-lg mx-0 lg:mx-12 w-full">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4.5 h-4.5" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                // Auto-select first matching item for trend graph if search narrows down
                const matched = purchases.find((p) =>
                  p.itemName.toLowerCase().includes(e.target.value.toLowerCase())
                );
                if (matched && e.target.value.length > 1) {
                  setSelectedItemName(matched.itemName);
                }
              }}
              placeholder="Search cashews, oil, basmati, packets..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-transparent rounded-full text-sm font-medium text-slate-800 placeholder-slate-450 focus:bg-white focus:ring-2 focus:ring-indigo-500 border focus:border-indigo-500 transition-all outline-hidden"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 px-1.5 py-0.5 rounded bg-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Right Spend Widget */}
        <div className="flex items-center space-x-6 w-full lg:w-auto justify-between lg:justify-end border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100">
          <div className="text-left lg:text-right">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Spent (July)</p>
            <p className="text-lg font-black text-slate-900 font-sans">{formatRupees(totalSpentThisMonth)}</p>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-150 rounded-xl px-3 py-1.5 text-xs text-slate-600 font-medium">
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span className="font-mono">
              {new Date().toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Split Layout */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Aside Sidebar (Add Form & Quick Filters) */}
        <aside className="w-full lg:w-90 xl:w-96 bg-white border-r border-slate-200 p-6 xl:p-8 flex flex-col space-y-6 flex-shrink-0 overflow-y-auto lg:h-full">
          <div>
            <AddPurchaseForm
              onAdd={handleAddPurchase}
              onUpdate={handleUpdatePurchase}
              editingPurchase={editingPurchase}
              onCancelEdit={() => setEditingPurchase(null)}
              existingPurchases={purchases}
            />
          </div>

          {/* Quick Filters preset (From design aside style) */}
          <div className="pt-6 border-t border-slate-100">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Quick Filter Presets</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  timeFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Records
              </button>
              <button
                onClick={() => setTimeFilter('7days')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  timeFilter === '7days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setTimeFilter('30days')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                  timeFilter === '30days'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Last 30 Days
              </button>
            </div>
            
            {/* Meta indicator */}
            <div className="mt-4 flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
              <Database className="w-3.5 h-3.5" />
              <span>Offline browser state storage</span>
            </div>
          </div>
        </aside>

        {/* Right Dashboard panel */}
        <section className="flex-1 p-6 xl:p-8 flex flex-col space-y-6 bg-slate-50 overflow-y-auto lg:h-full">
          
          {/* Quick metrics */}
          <PurchaseStats purchases={globallyFilteredPurchases} />

          {/* Graphical Analysis & Interactive Table Row */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
            
            {/* List with lifted search query (Span 7) */}
            <div className="xl:col-span-7">
              <PurchaseList
                purchases={globallyFilteredPurchases}
                onDelete={handleDeletePurchase}
                onEdit={handleEditInit}
                selectedItemName={selectedItemName}
                onSelectItem={setSelectedItemName}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            </div>

            {/* Fluctuation Chart (Span 5) */}
            <div className="xl:col-span-5">
              <PriceTrendChart
                purchases={globallyFilteredPurchases}
                selectedItemName={selectedItemName}
              />
            </div>

          </div>

          <footer className="pt-4 text-center text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1">
            <span>Keep logs securely stored right in your browser</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          </footer>

        </section>

      </main>

    </div>
  );
}

