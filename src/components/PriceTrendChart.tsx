import React, { useState, useMemo } from 'react';
import { Purchase } from '../types';
import { formatRupees, formatDate } from '../utils';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Info, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PriceTrendChartProps {
  purchases: Purchase[];
  selectedItemName: string | null;
}

export default function PriceTrendChart({ purchases, selectedItemName }: PriceTrendChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    purchase: Purchase;
    index: number;
  } | null>(null);

  // Filter and sort purchases for the selected item
  const itemHistory = useMemo(() => {
    if (!selectedItemName) return [];
    return purchases
      .filter((p) => p.itemName.toLowerCase() === selectedItemName.toLowerCase())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [purchases, selectedItemName]);

  // General stats for the selected item
  const stats = useMemo(() => {
    if (itemHistory.length === 0) return null;

    const prices = itemHistory.map((p) => p.pricePerUnit);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    
    // Calculate trend percentage compared to the previous purchase
    let trendPercent = 0;
    if (itemHistory.length > 1) {
      const latest = itemHistory[itemHistory.length - 1].pricePerUnit;
      const previous = itemHistory[itemHistory.length - 2].pricePerUnit;
      trendPercent = ((latest - previous) / previous) * 100;
    }

    return { minPrice, maxPrice, avgPrice, trendPercent };
  }, [itemHistory]);

  // SVG dimensions
  const width = 500;
  const height = 200;
  const paddingX = 40;
  const paddingY = 30;

  // Generate SVG path coordinates
  const chartPoints = useMemo(() => {
    if (itemHistory.length === 0) return [];

    const prices = itemHistory.map((p) => p.pricePerUnit);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // avoid divide by zero if all prices same

    const timeMin = new Date(itemHistory[0].date).getTime();
    const timeMax = new Date(itemHistory[itemHistory.length - 1].date).getTime();
    const timeRange = timeMax - timeMin || 1; // avoid divide by zero if single date

    return itemHistory.map((purchase, i) => {
      // X coordinate based on date (or index if single/similar dates)
      const x =
        itemHistory.length === 1
          ? width / 2
          : paddingX +
            ((new Date(purchase.date).getTime() - timeMin) / timeRange) *
              (width - paddingX * 2);

      // Y coordinate based on price (lower price = higher Y because SVG is top-to-bottom)
      const y =
        maxPrice === minPrice
          ? height / 2
          : height -
            paddingY -
            ((purchase.pricePerUnit - minPrice) / priceRange) *
              (height - paddingY * 2);

      return { x, y, purchase, index: i };
    });
  }, [itemHistory, width, height]);

  // Create path line
  const linePath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    return chartPoints.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
  }, [chartPoints]);

  // Create smooth curved path
  const curvePath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    let path = `M ${chartPoints[0].x} ${chartPoints[0].y}`;
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i];
      const p1 = chartPoints[i + 1];
      // Control points for a cubic bezier curve
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  }, [chartPoints]);

  // Area under curve path
  const areaPath = useMemo(() => {
    if (chartPoints.length < 2) return '';
    const baseCurve = curvePath;
    const lastPoint = chartPoints[chartPoints.length - 1];
    const firstPoint = chartPoints[0];
    return `${baseCurve} L ${lastPoint.x} ${height - paddingY} L ${firstPoint.x} ${height - paddingY} Z`;
  }, [chartPoints, curvePath]);

  if (!selectedItemName) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col justify-center items-center text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Price Intelligence Graph</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-[280px]">
          Click any item in the purchase list below or search for an item to view its price fluctuation trends over time.
        </p>
      </div>
    );
  }

  if (itemHistory.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 h-full flex flex-col justify-center items-center text-center shadow-xs">
        <p className="text-sm text-slate-500">No purchase records found for "{selectedItemName}"</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs flex flex-col h-full justify-between">
      <div>
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Price History Analyzer</span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5 truncate max-w-[320px]">
              {itemHistory[0].itemName}
            </h3>
          </div>
          {stats && itemHistory.length > 1 && (
            <div
              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                stats.trendPercent > 0
                  ? 'bg-rose-50 text-rose-600'
                  : stats.trendPercent < 0
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              {stats.trendPercent > 0 ? (
                <>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+{stats.trendPercent.toFixed(1)}%</span>
                </>
              ) : stats.trendPercent < 0 ? (
                <>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>{stats.trendPercent.toFixed(1)}%</span>
                </>
              ) : (
                <span>Unchanged</span>
              )}
              <span className="text-[10px] font-normal text-slate-400">vs last</span>
            </div>
          )}
        </div>

        {/* Dynamic micro-stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3 my-4">
            <div className="bg-slate-50/60 rounded-xl p-2.5 border border-slate-100">
              <span className="block text-[10px] text-slate-500 font-medium uppercase">Average Price</span>
              <span className="font-mono text-sm font-semibold text-slate-800">
                {formatRupees(stats.avgPrice)}
                <span className="text-[10px] font-normal text-slate-400 ml-0.5">/{itemHistory[0].unit}</span>
              </span>
            </div>
            <div className="bg-emerald-50/30 rounded-xl p-2.5 border border-emerald-100/50">
              <span className="block text-[10px] text-emerald-700 font-medium uppercase">Lowest Price</span>
              <span className="font-mono text-sm font-semibold text-emerald-600">
                {formatRupees(stats.minPrice)}
              </span>
            </div>
            <div className="bg-rose-50/30 rounded-xl p-2.5 border border-rose-100/50">
              <span className="block text-[10px] text-rose-700 font-medium uppercase">Highest Price</span>
              <span className="font-mono text-sm font-semibold text-rose-600">
                {formatRupees(stats.maxPrice)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SVG Line Graph */}
      <div className="relative my-2 w-full flex items-center justify-center">
        {itemHistory.length === 1 ? (
          <div className="h-[150px] w-full flex flex-col items-center justify-center border border-dashed border-slate-100 bg-slate-50/40 rounded-xl p-4">
            <span className="text-slate-400 font-mono text-sm font-semibold">{formatRupees(itemHistory[0].pricePerUnit)}</span>
            <span className="text-xs text-slate-500 text-center mt-1">
              Bought once on {formatDate(itemHistory[0].date)}. Add more purchases of this item to see a price fluctuation graph.
            </span>
          </div>
        ) : (
          <div className="relative w-full overflow-visible">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto overflow-visible select-none"
            >
              {/* Gradients */}
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={width - paddingX}
                y2={paddingY}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <line
                x1={paddingX}
                y1={height - paddingY}
                x2={width - paddingX}
                y2={height - paddingY}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              {/* Area path */}
              <path d={areaPath} fill="url(#chart-area-grad)" />

              {/* Trend line */}
              <path
                d={curvePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Dots */}
              {chartPoints.map((pt, idx) => (
                <g key={pt.purchase.id}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={hoveredPoint?.index === idx ? '6' : '4'}
                    fill={hoveredPoint?.index === idx ? '#4f46e5' : '#ffffff'}
                    stroke="#6366f1"
                    strokeWidth="2"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setHoveredPoint({
                        x: pt.x,
                        y: pt.y,
                        purchase: pt.purchase,
                        index: idx,
                      });
                    }}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              ))}
            </svg>

            {/* Custom Tooltip absolute inside parent */}
            <AnimatePresence>
              {hoveredPoint && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  className="absolute pointer-events-none bg-slate-900 text-white rounded-xl p-3 shadow-xl border border-slate-800 text-xs font-sans min-w-[150px] z-20"
                  style={{
                    left: `${(hoveredPoint.x / width) * 100}%`,
                    top: `${(hoveredPoint.y / height) * 100 - 65}%`,
                    transform: 'translate(-50%, -100%)',
                  }}
                >
                  <div className="flex items-center gap-1 text-slate-400 font-medium mb-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{formatDate(hoveredPoint.purchase.date)}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Unit Cost:</span>
                    <span className="font-mono font-semibold text-indigo-300">
                      {formatRupees(hoveredPoint.purchase.pricePerUnit)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-400">Quantity:</span>
                    <span className="font-semibold text-white">
                      {hoveredPoint.purchase.quantity} {hoveredPoint.purchase.unit}
                    </span>
                  </div>
                  <div className="border-t border-slate-800 pt-1 mt-1 flex justify-between items-center font-medium">
                    <span className="text-slate-400">Total Spent:</span>
                    <span className="text-emerald-400 font-mono">
                      {formatRupees(hoveredPoint.purchase.totalPrice)}
                    </span>
                  </div>
                  {hoveredPoint.purchase.notes && (
                    <div className="text-[10px] text-slate-400 italic mt-1.5 border-t border-slate-800 pt-1 truncate">
                      "{hoveredPoint.purchase.notes}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400 font-medium px-1">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-indigo-500" />
          <span>First: {formatDate(itemHistory[0].date)}</span>
        </div>
        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-sm font-mono text-[10px]">
          {itemHistory.length} Record{itemHistory.length > 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3 text-indigo-500" />
          <span>Latest: {formatDate(itemHistory[itemHistory.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
