import React, { useMemo } from 'react';
import { Purchase } from '../types';
import { formatRupees } from '../utils';
import { DollarSign, ShoppingBag, PieChart, Coins, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

interface PurchaseStatsProps {
  purchases: Purchase[];
}

export default function PurchaseStats({ purchases }: PurchaseStatsProps) {
  const stats = useMemo(() => {
    const totalSpent = purchases.reduce((sum, p) => sum + p.totalPrice, 0);
    const uniqueItems = new Set(purchases.map((p) => p.itemName.toLowerCase())).size;
    const averageSpend = purchases.length > 0 ? totalSpent / purchases.length : 0;

    // Find the single highest total cost purchase
    let maxPurchase = purchases[0] || null;
    for (let i = 1; i < purchases.length; i++) {
      if (purchases[i].totalPrice > (maxPurchase?.totalPrice || 0)) {
        maxPurchase = purchases[i];
      }
    }

    return {
      totalSpent,
      totalCount: purchases.length,
      uniqueItems,
      averageSpend,
      maxPurchase,
    };
  }, [purchases]);

  const cards = [
    {
      title: 'Total Outflow',
      value: formatRupees(stats.totalSpent),
      icon: Coins,
      bgColor: 'bg-emerald-50 text-emerald-600 border-emerald-100/50',
      description: 'Accumulated spending',
    },
    {
      title: 'Shopping Orders',
      value: `${stats.totalCount} Purchases`,
      icon: ShoppingBag,
      bgColor: 'bg-indigo-50 text-indigo-600 border-indigo-100/50',
      description: 'Total logged transactions',
    },
    {
      title: 'Distinct Products',
      value: `${stats.uniqueItems} Unique Items`,
      icon: PieChart,
      bgColor: 'bg-amber-50 text-amber-600 border-amber-100/50',
      description: 'Catalog size',
    },
    {
      title: 'Average Order',
      value: formatRupees(stats.averageSpend),
      icon: DollarSign,
      bgColor: 'bg-sky-50 text-sky-600 border-sky-100/50',
      description: 'Average spent per entry',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComp = card.icon;
        return (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${card.bgColor}`}>
                <IconComp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xl lg:text-2xl font-bold tracking-tight text-slate-900 block font-sans">
                {card.value}
              </span>
              <span className="text-[10px] text-slate-400 font-medium block mt-1">
                {card.description}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
