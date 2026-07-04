import { Purchase } from './types';

// Helper to format rupees currency nicely
export function formatRupees(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date to readable string (e.g., "04 Jul 2026")
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  // Let's see if it's today
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Generate some smart mock data so the app has some content initially
export const SAMPLE_PURCHASES: Purchase[] = [
  {
    id: 'sample-1',
    itemName: 'Kaju (Cashew Nuts)',
    quantity: 2,
    unit: 'kgs',
    pricePerUnit: 800,
    totalPrice: 1600,
    date: new Date().toISOString().split('T')[0], // Today
    notes: 'Premium grade W320, bought from local dry fruits store',
  },
  {
    id: 'sample-2',
    itemName: 'Refined Cooking Oil Packets',
    quantity: 1,
    unit: 'packet',
    pricePerUnit: 800,
    totalPrice: 800,
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Yesterday
    notes: 'Pack of 20 small pouches, supermarket wholesale price',
  },
  {
    id: 'sample-3',
    itemName: 'Basmati Rice',
    quantity: 10,
    unit: 'kgs',
    pricePerUnit: 110,
    totalPrice: 1100,
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
    notes: 'Double Chabi brand, monthly grocery',
  },
  {
    id: 'sample-4',
    itemName: 'Kaju (Cashew Nuts)',
    quantity: 1,
    unit: 'kgs',
    pricePerUnit: 850,
    totalPrice: 850,
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 12 days ago
    notes: 'Emergency purchase for guests',
  },
];

// Initialize local storage with sample purchases if empty
export function getSavedPurchases(): Purchase[] {
  try {
    const saved = localStorage.getItem('purchase_records');
    if (!saved) {
      localStorage.setItem('purchase_records', JSON.stringify(SAMPLE_PURCHASES));
      return SAMPLE_PURCHASES;
    }
    return JSON.parse(saved);
  } catch (error) {
    console.error('Error reading localStorage', error);
    return SAMPLE_PURCHASES;
  }
}

// Save purchases to local storage
export function savePurchases(purchases: Purchase[]): void {
  try {
    localStorage.setItem('purchase_records', JSON.stringify(purchases));
  } catch (error) {
    console.error('Error saving to localStorage', error);
  }
}

// Standard unit suggestions
export const UNIT_PRESETS = [
  'kgs',
  'packet',
  'liter',
  'pc',
  'grams',
  'box',
  'bottle',
  'dozen',
];
