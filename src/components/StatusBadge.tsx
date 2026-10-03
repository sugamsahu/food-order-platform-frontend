import React from 'react';
import type { OrderStatus } from '../types';
import { STATUS_STYLE } from '../utils/orderStatus';

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLE[status]}`}>
    {status}
  </span>
);

export default StatusBadge;
