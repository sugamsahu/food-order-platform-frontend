import type { OrderStatus } from '../types';

export const ORDER_STATUSES: OrderStatus[] = ['Placed', 'Accepted', 'Preparing', 'Ready', 'Completed', 'Cancelled'];

// Mirrors the server's state machine. The API enforces it too; this only decides which buttons to show.
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Placed: ['Accepted', 'Cancelled'],
  Accepted: ['Preparing', 'Cancelled'],
  Preparing: ['Ready', 'Cancelled'],
  Ready: ['Completed'],
  Completed: [],
  Cancelled: [],
};

export const allowedNext = (status: OrderStatus): OrderStatus[] => TRANSITIONS[status] ?? [];

export const ACTION_LABEL: Record<OrderStatus, string> = {
  Placed: 'Place order',
  Accepted: 'Accept order',
  Preparing: 'Start preparing',
  Ready: 'Mark ready',
  Completed: 'Mark completed',
  Cancelled: 'Cancel order',
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  Placed: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/30',
  Accepted: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  Preparing: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  Ready: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  Completed: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  Cancelled: 'bg-red-500/10 text-red-300 border-red-500/30',
};
