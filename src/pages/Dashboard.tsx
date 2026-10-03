import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { errorMessage } from '../utils/errors';
import { ORDER_STATUSES } from '../utils/orderStatus';
import type { OrderStatus } from '../types';
import { ErrorState, LoadingState } from '../components/StateViews';
import { cardClass } from '../components/ui';

interface Metrics { counts: Record<OrderStatus, number>; total: number }

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setMetrics((await api.get<Metrics>('/orders/metrics')).data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load order counts.'));
    }
  }, []);

  useEffect(() => {
    let active = true;
    api.get<Metrics>('/orders/metrics')
      .then((res) => { if (active) setMetrics(res.data); })
      .catch((err) => { if (active) setError(errorMessage(err, 'Could not load order counts.')); });
    return () => { active = false; };
  }, []);

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name}</h1>
        <p className="text-gray-400">Here is what is happening with your restaurant today.</p>
      </header>

      {error ? <ErrorState message={error} onRetry={load} /> : !metrics ? <LoadingState label="Loading order counts" /> : (
        <section aria-label="Order counts by status" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/orders" className={`${cardClass} p-5 hover:border-orange-500/50 transition-colors col-span-2 lg:col-span-1`}>
            <div className="flex items-center justify-between text-gray-400 text-sm"><span>Total orders</span><ShoppingBag className="w-5 h-5" aria-hidden="true" /></div>
            <p className="text-3xl font-bold text-white mt-2">{metrics.total}</p>
          </Link>
          {ORDER_STATUSES.map((status) => (
            <Link key={status} to={`/orders?status=${status}`} className={`${cardClass} p-5 hover:border-orange-500/50 transition-colors`}>
              <div className="flex items-center justify-between text-gray-400 text-sm"><span>{status}</span><Activity className="w-5 h-5" aria-hidden="true" /></div>
              <p className="text-3xl font-bold text-white mt-2">{metrics.counts[status]}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  );
};

export default Dashboard;
