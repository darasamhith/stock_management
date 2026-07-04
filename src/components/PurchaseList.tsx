import React, { useState, useMemo } from 'react';
import { Purchase } from '../types';
import { formatRupees, formatDate } from '../utils';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  FileSpreadsheet,
  Edit2,
  Trash2,
  ArrowUpDown,
  TrendingUp,
  Tag,
  Clock,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PurchaseListProps {
  purchases: Purchase[];
  onDelete: (id: string) => void;
  onEdit: (purchase: Purchase) => void;
  selectedItemName: string | null;
  onSelectItem: (name: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

type SortField = 'date' | 'pricePerUnit' | 'totalPrice' | 'quantity' | 'itemName';
type SortOrder = 'asc' | 'desc';

export default function PurchaseList({
  purchases,
  onDelete,
  onEdit,
  selectedItemName,
  onSelectItem,
  searchQuery,
  setSearchQuery,
}: PurchaseListProps) {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique units present in purchases for the filter dropdown
  const uniqueUnits = useMemo(() => {
    const units = purchases.map((p) => p.unit.toLowerCase());
    return ['all', ...Array.from(new Set(units))];
  }, [purchases]);

  // Handle Sort Change
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to desc for new field
    }
  };

  // Filter and sort the purchases list
  const filteredAndSortedPurchases = useMemo(() => {
    const queryStr = (searchQuery || '').toLowerCase();
    return purchases
      .filter((p) => {
        // Search filter
        const matchSearch =
          p.itemName.toLowerCase().includes(queryStr) ||
          (p.notes && p.notes.toLowerCase().includes(queryStr)) ||
          p.unit.toLowerCase().includes(queryStr);

        // Unit filter
        const matchUnit =
          selectedUnitFilter === 'all' || p.unit.toLowerCase() === selectedUnitFilter.toLowerCase();

        return matchSearch && matchUnit;
      })
      .sort((a, b) => {
        let valueA: any = a[sortField];
        let valueB: any = b[sortField];

        // Handle string comparison
        if (typeof valueA === 'string') {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (sortField === 'date') {
          valueA = new Date(a.date).getTime();
          valueB = new Date(b.date).getTime();
        }

        if (valueA < valueB) return sortOrder === 'asc' ? -1 : 1;
        if (valueA > valueB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [purchases, searchQuery, sortField, sortOrder, selectedUnitFilter]);

  // Export to CSV Function
  const handleExportCSV = () => {
    if (purchases.length === 0) return;

    // Headers
    const headers = ['Date', 'Item Name', 'Quantity', 'Unit', 'Price per Unit (₹)', 'Total Price (₹)', 'Notes'];
    
    // Row content
    const rows = purchases.map((p) => [
      p.date,
      `"${p.itemName.replace(/"/g, '""')}"`,
      p.quantity,
      p.unit,
      p.pricePerUnit,
      p.totalPrice,
      p.notes ? `"${p.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `purchase_records_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-full flex flex-col">
      {/* Title & Actions Row (Matching Sleek Design Mockup) */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-shrink-0">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span>Recent Activity</span>
            {searchQuery && (
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-mono">
                Filtered
              </span>
            )}
          </h2>
          <p className="text-[10px] text-slate-400 font-medium">Click items to inspect price variations</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit filter pill list or dropdown */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              showFilters || selectedUnitFilter !== 'all'
                ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {selectedUnitFilter !== 'all' && (
              <span className="bg-indigo-600 text-white w-1.5 h-1.5 rounded-full ml-0.5" />
            )}
          </button>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            disabled={purchases.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Expandable Filter drawer */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-50 border-b border-slate-100 -mx-6 px-6"
          >
            <div className="py-4 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" /> Filter by Unit:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueUnits.map((u) => (
                    <button
                      key={u}
                      onClick={() => setSelectedUnitFilter(u)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition ${
                        selectedUnitFilter === u
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {u.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sorting Table Header / Grid View */}
      <div className="mt-4 grid grid-cols-12 gap-2 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-500 select-none">
        <button
          onClick={() => handleSort('itemName')}
          className="col-span-4 flex items-center gap-1 hover:text-slate-800 transition text-left"
        >
          <span>ITEM NAME</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'itemName' ? 'text-indigo-500' : 'text-slate-400'}`} />
        </button>
        <button
          onClick={() => handleSort('quantity')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-800 transition text-right justify-end"
        >
          <span>QTY</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'quantity' ? 'text-indigo-500' : 'text-slate-400'}`} />
        </button>
        <button
          onClick={() => handleSort('pricePerUnit')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-800 transition text-right justify-end"
        >
          <span>COST/UNIT</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'pricePerUnit' ? 'text-indigo-500' : 'text-slate-400'}`} />
        </button>
        <button
          onClick={() => handleSort('totalPrice')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-800 transition text-right justify-end"
        >
          <span>TOTAL BILL</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'totalPrice' ? 'text-indigo-500' : 'text-slate-400'}`} />
        </button>
        <button
          onClick={() => handleSort('date')}
          className="col-span-2 flex items-center gap-1 hover:text-slate-800 transition text-right justify-end"
        >
          <span>DATE</span>
          <ArrowUpDown className={`w-3.5 h-3.5 ${sortField === 'date' ? 'text-indigo-500' : 'text-slate-400'}`} />
        </button>
      </div>

      {/* Purchase List Cards */}
      <div className="flex-1 mt-3 overflow-y-auto pr-1 space-y-2 max-h-[480px]">
        {filteredAndSortedPurchases.length === 0 ? (
          <div className="py-12 text-center text-slate-500 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No transactions recorded</p>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or record a new purchase above</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredAndSortedPurchases.map((purchase) => {
              const isSelected = selectedItemName?.toLowerCase() === purchase.itemName.toLowerCase();
              return (
                <motion.div
                  key={purchase.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`group relative grid grid-cols-12 gap-2 items-center px-4 py-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/70 border-indigo-200 shadow-xs'
                      : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                  onClick={() => onSelectItem(isSelected ? null : purchase.itemName)}
                >
                  {/* Left Highlight Marker */}
                  {isSelected && (
                    <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-600 rounded-r" />
                  )}

                  {/* Item Name & Notes */}
                  <div className="col-span-4 pr-2">
                    <span className="font-bold text-slate-900 group-hover:text-indigo-600 transition block text-sm truncate">
                      {purchase.itemName}
                    </span>
                    {purchase.notes ? (
                      <span className="text-[11px] text-slate-500 italic block mt-0.5 truncate max-w-[200px]">
                        "{purchase.notes}"
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-300" />
                        <span>Uncategorized purchase</span>
                      </span>
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      {purchase.quantity}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-sans">
                      {purchase.unit}
                    </span>
                  </div>

                  {/* Cost per unit */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {formatRupees(purchase.pricePerUnit)}
                    </span>
                    <span className="text-[9px] text-slate-400 block font-sans font-medium">
                      per {purchase.unit}
                    </span>
                  </div>

                  {/* Total price */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-sm font-extrabold text-emerald-600">
                      {formatRupees(purchase.totalPrice)}
                    </span>
                  </div>

                  {/* Date with action overlays on hover */}
                  <div className="col-span-2 text-right relative h-8 flex items-center justify-end">
                    {/* Date text (hidden when group is hovered so actions can show) */}
                    <div className="group-hover:hidden transition-all duration-150 flex flex-col items-end">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                        {formatDate(purchase.date)}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        {purchase.date.split('-').reverse().slice(0, 2).join('/')}
                      </span>
                    </div>

                    {/* Overlay Action Buttons */}
                    <div className="hidden group-hover:flex items-center gap-1.5 transition-all duration-150">
                      <button
                        title="Edit Purchase"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent selecting the item for trend graph
                          onEdit(purchase);
                        }}
                        className="w-7 h-7 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 flex items-center justify-center border border-indigo-100 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete Purchase"
                        onClick={(e) => {
                          e.stopPropagation(); // prevent selecting the item for trend graph
                          if (confirm(`Delete the purchase of ${purchase.quantity} ${purchase.unit} ${purchase.itemName}?`)) {
                            onDelete(purchase.id);
                          }
                        }}
                        className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center border border-rose-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
