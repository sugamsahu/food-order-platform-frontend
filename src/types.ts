export type Role = 'admin' | 'operator';
export type OrderStatus = 'Placed' | 'Accepted' | 'Preparing' | 'Ready' | 'Completed' | 'Cancelled';
export type FulfillmentType = 'pickup' | 'delivery';

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Food {
  id: number;
  name: string;
  description: string | null;
  category: string;
  price: string;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderSummary {
  id: number;
  reference: string;
  status: OrderStatus;
  fulfillment_type: FulfillmentType;
  total: string;
  currency: string;
  created_at: string;
  customer: { id: number; name: string; email: string } | null;
}

export interface OrderItem {
  id: number;
  food_id: number;
  food_name: string;
  unit_price: string;
  quantity: number;
  line_total: string;
}

export interface StatusHistoryEntry {
  id: number;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_type: 'staff' | 'customer' | 'system';
  actor_name: string | null;
  reason: string | null;
  created_at: string;
}

export interface OrderDetail extends OrderSummary {
  subtotal: string;
  delivery_address: string | null;
  notes: string | null;
  customer: { id: number; name: string; email: string; phone: string | null } | null;
  items: OrderItem[];
  status_history: StatusHistoryEntry[];
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface Page<T> {
  data: T[];
  pagination: Pagination;
}
