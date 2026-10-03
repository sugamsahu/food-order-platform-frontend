import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { RefreshCw, Search } from 'lucide-react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagedData } from '../hooks/usePagedData';
import { formatDateTime, formatMoney } from '../utils/format';
import { ORDER_STATUSES } from '../utils/orderStatus';
import type { OrderSummary } from '../types';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../components/StateViews';
import { btnGhost, cardClass, inputClass } from '../components/ui';

const Orders: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') ?? '');
  const [fulfillment, setFulfillment] = useState('');
  const [page, setPage] = useState(1);

  const q = useDebouncedValue(search.trim());
  const { data, loading, error, reload } = usePagedData<OrderSummary>('/orders', {
    q, status, fulfillment_type: fulfillment, page, page_size: 15,
  });

  // New orders arrive while staff work, so refresh quietly every 30 seconds.
  useEffect(() => {
    const id = setInterval(() => void reload(true), 30000);
    return () => clearInterval(id);
  }, [reload]);

  const change = (set: (v: string) => void) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    set(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Orders</h1>
          <p className="text-gray-400">Track and manage incoming customer orders, newest first.</p>
        </div>
        <button type="button" className={btnGhost} onClick={() => void reload()}><RefreshCw className="w-4 h-4" aria-hidden="true" /> Refresh</button>
      </header>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative">
          <label htmlFor="order-search" className="sr-only">Search by reference or customer</label>
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500 pointer-events-none" aria-hidden="true" />
          <input id="order-search" type="search" value={search} onChange={change(setSearch)} placeholder="Search reference, name, email..." className={`${inputClass} pl-10`} />
        </div>
        <div>
          <label htmlFor="order-status" className="sr-only">Filter by status</label>
          <select id="order-status" value={status} onChange={change(setStatus)} className={inputClass}>
            <option value="">All statuses</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="order-fulfillment" className="sr-only">Filter by fulfillment type</label>
          <select id="order-fulfillment" value={fulfillment} onChange={change(setFulfillment)} className={inputClass}>
            <option value="">Pickup and delivery</option>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
      </form>

      {loading && !data ? <LoadingState label="Loading orders" /> : error ? <ErrorState message={error} onRetry={() => reload()} /> : data && data.data.length === 0 ? (
        <EmptyState message="No orders match your filters." hint="Try a different search or status." />
      ) : data && (
        <>
          <div className={`${cardClass} overflow-x-auto`}>
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Orders, newest first</caption>
              <thead className="text-gray-400 border-b border-gray-800">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Type</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Placed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {data.data.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-800/40">
                    <td className="px-4 py-3"><Link to={`/orders/${o.id}`} className="font-mono font-semibold text-orange-400 hover:underline">{o.reference}</Link></td>
                    <td className="px-4 py-3 text-gray-200">{o.customer?.name}<span className="block text-xs text-gray-400">{o.customer?.email}</span></td>
                    <td className="px-4 py-3 capitalize text-gray-300">{o.fulfillment_type}</td>
                    <td className="px-4 py-3 text-right font-semibold text-white whitespace-nowrap">{formatMoney(o.total, o.currency)}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDateTime(o.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={data.pagination} onPage={setPage} noun="orders" />
        </>
      )}
    </div>
  );
};

export default Orders;
