export interface MenuItem {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  showImage?: boolean;
}

export interface CartItem extends MenuItem {
  quantity: number;
  status?: 'Pending' | 'Served';
}

export interface Order {
  id: string;
  tableId: string; // Used as "Takeaway" or a table ID from the 'tables' collection
  customerName: string;
  customerPhone: string;
  paymentMethod: 'Card' | 'Cash' | 'UPI';
  items: CartItem[];
  totalPrice: number;
  subtotal?: number;
  cgst?: number;
  sgst?: number;
  cashReceived?: number | null;
  changeDue?: number | null;
  status: 'Pending' | 'Received' | 'Preparing' | 'Served' | 'Ready' | 'Handover' | 'Completed';
  timestamp: any;
  orderNumber: string;
  createdAt: number;
}

export interface Table {
  id: string;
  tableNumber: string;
}
