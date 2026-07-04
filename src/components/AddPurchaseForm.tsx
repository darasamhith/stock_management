import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Purchase } from '../types';
import { UNIT_PRESETS } from '../utils';
import { PlusCircle, Calendar, Save, Trash2, HelpCircle, CornerDownRight, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddPurchaseFormProps {
  onAdd: (purchase: Omit<Purchase, 'id'>) => void;
  onUpdate?: (id: string, purchase: Omit<Purchase, 'id'>) => void;
  editingPurchase: Purchase | null;
  onCancelEdit?: () => void;
  existingPurchases: Purchase[];
}

export default function AddPurchaseForm({
  onAdd,
  onUpdate,
  editingPurchase,
  onCancelEdit,
  existingPurchases,
}: AddPurchaseFormProps) {
  // Main form fields
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('kgs');
  const [pricePerUnit, setPricePerUnit] = useState<number | ''>('');
  const [totalPrice, setTotalPrice] = useState<number | ''>('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // Active state to track whether to calculate total from price-per-unit or vice-versa
  const [calculationMode, setCalculationMode] = useState<'total' | 'unit'>('total');

  // Input focus/dropdown state for autocompleting item names
  const [isItemFocused, setIsItemFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load editing state if provided
  useEffect(() => {
    if (editingPurchase) {
      setItemName(editingPurchase.itemName);
      setQuantity(editingPurchase.quantity);
      setUnit(editingPurchase.unit);
      setPricePerUnit(editingPurchase.pricePerUnit);
      setTotalPrice(editingPurchase.totalPrice);
      setDate(editingPurchase.date);
      setNotes(editingPurchase.notes || '');
    } else {
      // Clear form for new purchase, but keep the current date and unit
      setItemName('');
      setQuantity('');
      setPricePerUnit('');
      setTotalPrice('');
      setNotes('');
    }
  }, [editingPurchase]);

  // Unique list of previously bought items for autocomplete suggestions
  const itemSuggestions = useMemo(() => {
    const names = existingPurchases.map((p) => p.itemName);
    const unique = Array.from(new Set(names));
    if (!itemName) return unique.slice(0, 5); // show top 5 when empty
    return unique
      .filter((name) => name.toLowerCase().includes(itemName.toLowerCase()))
      .slice(0, 5);
  }, [existingPurchases, itemName]);

  // Auto calculate total price or price per unit based on standard math
  useEffect(() => {
    if (quantity && quantity > 0) {
      if (calculationMode === 'total' && pricePerUnit !== '') {
        const calculated = Number((Number(quantity) * Number(pricePerUnit)).toFixed(2));
        setTotalPrice(calculated);
      } else if (calculationMode === 'unit' && totalPrice !== '') {
        const calculated = Number((Number(totalPrice) / Number(quantity)).toFixed(2));
        setPricePerUnit(calculated);
      }
    } else {
      if (calculationMode === 'total') {
        setTotalPrice('');
      } else {
        setPricePerUnit('');
      }
    }
  }, [quantity, pricePerUnit, totalPrice, calculationMode]);

  // Handle outside click to close suggestions dropdown
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsItemFocused(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!itemName.trim()) return;
    const finalQuantity = Number(quantity) || 1;
    const finalPricePerUnit = Number(pricePerUnit) || 0;
    const finalTotalPrice = Number(totalPrice) || (finalQuantity * finalPricePerUnit);

    const data = {
      itemName: itemName.trim(),
      quantity: finalQuantity,
      unit: unit.trim() || 'units',
      pricePerUnit: finalPricePerUnit,
      totalPrice: finalTotalPrice,
      date,
      notes: notes.trim() || undefined,
    };

    if (editingPurchase && onUpdate) {
      onUpdate(editingPurchase.id, data);
    } else {
      onAdd(data);
    }

    // Reset fields
    setItemName('');
    setQuantity('');
    setPricePerUnit('');
    setTotalPrice('');
    setNotes('');
    setCalculationMode('total');
  };

  const handleSuggestionClick = (name: string) => {
    setItemName(name);
    setIsItemFocused(false);

    // Autofill most common unit used for this item if possible
    const match = existingPurchases.find((p) => p.itemName.toLowerCase() === name.toLowerCase());
    if (match) {
      setUnit(match.unit);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs relative overflow-hidden">
      {/* Decorative colored glow on top left */}
      <div className="absolute top-0 left-0 w-32 h-[3px] bg-indigo-500" />

      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            {editingPurchase ? <Sparkles className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {editingPurchase ? 'Modify Purchase Record' : 'Record New Purchase'}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {editingPurchase ? 'Correct typo or pricing error' : 'Keep your purchase catalog up-to-date'}
            </p>
          </div>
        </div>
        {editingPurchase && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-[10px] bg-slate-100 text-slate-600 hover:bg-slate-200 px-2.5 py-1 rounded-md font-semibold transition"
          >
            Cancel Edit
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 font-sans">
        {/* Item Name with Auto-suggestions */}
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Item Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            onFocus={() => setIsItemFocused(true)}
            placeholder="e.g., Kaju (Cashew Nuts), Sunflower Oil Packet"
            className="w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800"
          />

          {/* Autocomplete Suggestions */}
          <AnimatePresence>
            {isItemFocused && itemSuggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 right-0 top-[102%] bg-white border border-slate-200 rounded-xl shadow-lg mt-1 z-30 max-h-[180px] overflow-y-auto"
              >
                <div className="p-1.5">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider px-2 py-1 flex items-center justify-between">
                    <span>Previous Items Purchased</span>
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                  {itemSuggestions.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleSuggestionClick(name)}
                      className="w-full text-left text-xs font-medium text-slate-700 hover:bg-slate-50 px-2.5 py-2 rounded-lg flex items-center gap-2 transition"
                    >
                      <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                      <span>{name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quantity & Custom/Preset Unit */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Quantity Purchased
            </label>
            <input
              type="number"
              min="0.001"
              step="any"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 2 or 1.5"
              className="w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Unit Used
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g., kgs, packet, liter"
              className="w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Quick Unit Presets Buttons */}
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            Quick Unit Presets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {UNIT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setUnit(preset)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition ${
                  unit.toLowerCase() === preset.toLowerCase()
                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Unit Cost & Total Pricing Calculation Toggle */}
        <div className="border border-slate-100 bg-slate-50/30 rounded-2xl p-4 space-y-3.5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              Pricing Calculator
            </span>
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setCalculationMode('total');
                  setPricePerUnit(pricePerUnit || '');
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition ${
                  calculationMode === 'total'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Set Cost/Unit
              </button>
              <button
                type="button"
                onClick={() => {
                  setCalculationMode('unit');
                  setTotalPrice(totalPrice || '');
                }}
                className={`text-[9px] font-bold px-2 py-1 rounded-md transition ${
                  calculationMode === 'unit'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Set Total Bill
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Cost Per {unit || 'unit'} (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required={calculationMode === 'total'}
                disabled={calculationMode === 'unit' && !totalPrice}
                value={pricePerUnit}
                onChange={(e) => {
                  setCalculationMode('total');
                  setPricePerUnit(e.target.value === '' ? '' : Number(e.target.value));
                }}
                placeholder={calculationMode === 'unit' ? 'Auto calculated' : 'e.g., 800'}
                className={`w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-medium ${
                  calculationMode === 'unit' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-slate-800'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Total Cost (₹)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required={calculationMode === 'unit'}
                disabled={calculationMode === 'total' && !pricePerUnit}
                value={totalPrice}
                onChange={(e) => {
                  setCalculationMode('unit');
                  setTotalPrice(e.target.value === '' ? '' : Number(e.target.value));
                }}
                placeholder={calculationMode === 'total' ? 'Auto calculated' : 'e.g., 1600'}
                className={`w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-medium ${
                  calculationMode === 'total' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'text-slate-800'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Date of Purchase */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Purchase Date</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono font-medium text-slate-800"
          />
        </div>

        {/* Notes (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Notes / Vendor Details <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Reliance Smart Bazaar, high grade, festival offer"
            className="w-full text-sm bg-slate-50/60 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-hidden focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium text-slate-800 resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center gap-2 cursor-pointer transition active:scale-98"
        >
          <Save className="w-4 h-4" />
          <span>{editingPurchase ? 'Update Purchase' : 'Save Purchase Record'}</span>
        </button>
      </form>
    </div>
  );
}
