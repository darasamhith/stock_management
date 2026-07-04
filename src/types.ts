export interface Purchase {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  date: string; // YYYY-MM-DD
  notes?: string;
}

export interface PurchaseStats {
  totalSpent: number;
  totalPurchases: number;
  uniqueArticles: number;
  mostExpensivePurchase: Purchase | null;
}
