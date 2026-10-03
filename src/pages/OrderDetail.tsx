import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2, Pencil } from 'lucide-react';
import api from '../utils/api';
import { applyFieldErrors, errorCode, errorMessage } from '../utils/errors';
import { formatDateTime, formatMoney } from '../utils/format';
import { ACTION_LABEL, allowedNext } from '../utils/orderStatus';
import type { FulfillmentType, OrderDetail as OrderDetailType, OrderStatus } from '../types';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { ErrorState, LoadingState } from '../components/StateViews';
import { btnDanger, btnGhost, btnPrimary, cardClass, inputClass, labelClass } from '../components/ui';

const CancelDialog: React.FC<{ reference: string; onConfirm: (reason: string) => Promise<void>; onClose: () => void }> = ({ reference, onConfirm, onClose }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ reason: string }>();
  return (
    <Modal title={`Cancel order ${reference}`} onClose={onClose}>
      <form onSubmit={handleSubmit(async ({ reason }) => { await onConfirm(reason.trim()); })} noValidate className="space-y-4">
        <div>
          <label htmlFor="cancel-reason" className={labelClass}>Reason for cancelling</label>
          <textarea id="cancel-reason" rows={3} aria-invalid={!!errors.reason} aria-describedby={errors.reason ? 'cancel-reason-error' : undefined}
            {...register('reason', { validate: (v) => v.trim().length > 0 || 'A reason is required to cancel an order' })} className={inputClass} />
          {errors.reason && <p id="cancel-reason-error" className="mt-1 text-sm text-red-400">{errors.reason.message}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={onClose}>Keep order</button>
          <button type="submit" className={btnDanger} disabled={isSubmitting}>Cancel order</button>
        </div>
      </form>
    </Modal>
  );
};

interface NotesValues { notes: string }
const NotesDialog: React.FC<{ order: OrderDetailType; onSaved: () => void; onClose: () => void }> = ({ order, onSaved, onClose }) => {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<NotesValues>({ defaultValues: { notes: order.notes ?? '' } });
  const submit = async (v: NotesValues) => {
    try {
      await api.patch(`/orders/${order.id}`, { notes: v.notes.trim() || null });
      toast.success('Notes saved');
      onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };
  return (
    <Modal title="Edit internal notes" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} className="space-y-4">
        <div>
          <label htmlFor="order-notes" className={labelClass}>Internal notes</label>
          <textarea id="order-notes" rows={4} maxLength={1000} {...register('notes')} className={inputClass} placeholder="Add notes for staff here..." />
          {errors.notes && <p className="mt-1 text-sm text-red-400">{errors.notes.message}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>Save notes</button>
        </div>
      </form>
    </Modal>
  );
};

interface FulfillmentValues { fulfillment_type: FulfillmentType; delivery_address: string }
const FulfillmentDialog: React.FC<{ order: OrderDetailType; onSaved: () => void; onClose: () => void }> = ({ order, onSaved, onClose }) => {
  const { register, handleSubmit, setError, control, formState: { errors, isSubmitting } } = useForm<FulfillmentValues>({
    defaultValues: { fulfillment_type: order.fulfillment_type, delivery_address: order.delivery_address ?? '' },
  });
  const type = useWatch({ control, name: 'fulfillment_type' });
  const submit = async (v: FulfillmentValues) => {
    if (v.fulfillment_type === 'delivery' && !v.delivery_address.trim()) {
      setError('delivery_address', { message: 'A delivery address is required for delivery orders' });
      return;
    }
    try {
      await api.patch(`/orders/${order.id}`, { fulfillment_type: v.fulfillment_type, delivery_address: v.fulfillment_type === 'delivery' ? v.delivery_address.trim() : null });
      toast.success('Fulfillment details saved');
      onSaved();
    } catch (err) {
      if (!applyFieldErrors(err, setError)) toast.error(errorMessage(err));
    }
  };
  return (
    <Modal title="Edit fulfillment details" onClose={onClose}>
      <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
        <div>
          <label htmlFor="fulfillment-type" className={labelClass}>Fulfillment type</label>
          <select id="fulfillment-type" {...register('fulfillment_type')} className={inputClass}>
            <option value="pickup">Pickup</option>
            <option value="delivery">Delivery</option>
          </select>
        </div>
        {type === 'delivery' && (
          <div>
            <label htmlFor="delivery-address" className={labelClass}>Delivery address</label>
            <textarea id="delivery-address" rows={3} aria-invalid={!!errors.delivery_address} aria-describedby={errors.delivery_address ? 'delivery-address-error' : undefined} {...register('delivery_address')} className={inputClass} />
            {errors.delivery_address && <p id="delivery-address-error" className="mt-1 text-sm text-red-400">{errors.delivery_address.message}</p>}
          </div>
        )}
        <div className="flex justify-end gap-3">
          <button type="button" className={btnGhost} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={isSubmitting}>Save details</button>
        </div>
      </form>
    </Modal>
  );
};

const loadError = (err: unknown) => (errorCode(err) === 'NOT_FOUND' ? 'This order does not exist.' : errorMessage(err, 'Could not load this order.'));

const OrderDetailPage: React.FC = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<OrderDetailType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<OrderStatus | null>(null);
  const [dialog, setDialog] = useState<'cancel' | 'notes' | 'fulfillment' | null>(null);

  const fetchOrder = useCallback(() => api.get<OrderDetailType>(`/orders/${id}`).then((res) => res.data), [id]);

  // Used by Retry and after edits.
  const load = useCallback(async () => {
    setError(null);
    try {
      setOrder(await fetchOrder());
    } catch (err) {
      setError(loadError(err));
    }
  }, [fetchOrder]);

  useEffect(() => {
    let active = true;
    fetchOrder()
      .then((data) => { if (active) { setOrder(data); setError(null); } })
      .catch((err) => { if (active) setError(loadError(err)); });
    return () => { active = false; };
  }, [fetchOrder]);

  const transition = async (to: OrderStatus, reason?: string) => {
    if (!order) return;
    setBusy(to);
    try {
      // "from" lets the server detect that someone else already changed the order.
      const res = await api.post<OrderDetailType>(`/orders/${order.id}/transitions`, { from: order.status, to, reason });
      setOrder(res.data);
      toast.success(`Order ${res.data.reference} is now ${to}`);
      setDialog(null);
    } catch (err) {
      toast.error(errorMessage(err));
      if (['STATE_CONFLICT', 'INVALID_TRANSITION', 'TERMINAL_STATE'].includes(errorCode(err) ?? '')) await load();
      throw err;
    } finally {
      setBusy(null);
    }
  };

  const saved = () => {
    setDialog(null);
    void load();
  };

  if (error) return <div><BackLink /><ErrorState message={error} onRetry={load} /></div>;
  if (!order) return <div><BackLink /><LoadingState label="Loading order" /></div>;

  const next = allowedNext(order.status);
  const fulfillmentEditable = !['Ready', 'Completed', 'Cancelled'].includes(order.status);

  return (
    <div>
      <BackLink />
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">{order.reference}</h1>
          <p className="text-gray-400 text-sm mt-1">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <StatusBadge status={order.status} />
      </header>

      <section aria-labelledby="actions-heading" className={`${cardClass} p-5 mb-6`}>
        <h2 id="actions-heading" className="font-bold text-white mb-3">Update status</h2>
        {next.length === 0 ? (
          <p className="text-gray-400">This order is {order.status.toLowerCase()}. No further changes are possible.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {next.map((to) => to === 'Cancelled'
              ? <button key={to} type="button" className={btnDanger} onClick={() => setDialog('cancel')} disabled={busy !== null}>{ACTION_LABEL[to]}</button>
              : <button key={to} type="button" className={btnPrimary} disabled={busy !== null} onClick={() => void transition(to).catch(() => undefined)}>
                {busy === to && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}{ACTION_LABEL[to]}
              </button>)}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section aria-labelledby="items-heading" className={`${cardClass} overflow-x-auto`}>
            <h2 id="items-heading" className="font-bold text-white p-5 pb-3">Items</h2>
            <table className="w-full text-sm text-left">
              <thead className="text-gray-400 border-y border-gray-800">
                <tr>
                  <th scope="col" className="px-5 py-2 font-medium">Item</th>
                  <th scope="col" className="px-3 py-2 font-medium text-right">Price</th>
                  <th scope="col" className="px-3 py-2 font-medium text-right">Qty</th>
                  <th scope="col" className="px-5 py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {order.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-5 py-3 text-gray-200">{i.food_name}</td>
                    <td className="px-3 py-3 text-right text-gray-300">{formatMoney(i.unit_price, order.currency)}</td>
                    <td className="px-3 py-3 text-right text-gray-300">{i.quantity}</td>
                    <td className="px-5 py-3 text-right text-white">{formatMoney(i.line_total, order.currency)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-800">
                <tr><th scope="row" colSpan={3} className="px-5 py-2 text-right text-gray-400 font-medium">Subtotal</th><td className="px-5 py-2 text-right text-gray-200">{formatMoney(order.subtotal, order.currency)}</td></tr>
                <tr><th scope="row" colSpan={3} className="px-5 py-2 text-right text-white font-bold">Total</th><td className="px-5 py-2 text-right text-white font-bold">{formatMoney(order.total, order.currency)}</td></tr>
              </tfoot>
            </table>
          </section>

          <section aria-labelledby="timeline-heading" className={`${cardClass} p-5`}>
            <h2 id="timeline-heading" className="font-bold text-white mb-4">Status timeline</h2>
            <ol className="space-y-4 border-l border-gray-700 ml-2">
              {order.status_history.map((h) => (
                <li key={h.id} className="pl-5 relative">
                  <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-orange-500" aria-hidden="true" />
                  <p className="text-white font-medium">{h.from_status ? `${h.from_status} \u2192 ${h.to_status}` : h.to_status}</p>
                  <p className="text-xs text-gray-400">{formatDateTime(h.created_at)} &middot; {h.actor_name ?? h.actor_type} ({h.actor_type})</p>
                  {h.reason && <p className="text-sm text-red-300 mt-1">Reason: {h.reason}</p>}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-6">
          <section aria-labelledby="customer-heading" className={`${cardClass} p-5`}>
            <h2 id="customer-heading" className="font-bold text-white mb-3">Customer</h2>
            <p className="text-gray-200">{order.customer?.name}</p>
            <p className="text-sm text-gray-400">{order.customer?.email}</p>
            {order.customer?.phone && <p className="text-sm text-gray-400">{order.customer.phone}</p>}
          </section>

          <section aria-labelledby="fulfillment-heading" className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 id="fulfillment-heading" className="font-bold text-white">Fulfillment</h2>
              {fulfillmentEditable && <button type="button" onClick={() => setDialog('fulfillment')} className="text-sm text-orange-400 hover:underline inline-flex items-center gap-1"><Pencil className="w-3 h-3" aria-hidden="true" /> Edit<span className="sr-only"> fulfillment details</span></button>}
            </div>
            <p className="text-gray-200 capitalize">{order.fulfillment_type}</p>
            {order.fulfillment_type === 'delivery' && <p className="text-sm text-gray-400 mt-1 whitespace-pre-line">{order.delivery_address}</p>}
          </section>

          <section aria-labelledby="notes-heading" className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between mb-3">
              <h2 id="notes-heading" className="font-bold text-white">Internal notes</h2>
              <button type="button" onClick={() => setDialog('notes')} className="text-sm text-orange-400 hover:underline inline-flex items-center gap-1"><Pencil className="w-3 h-3" aria-hidden="true" /> Edit<span className="sr-only"> internal notes</span></button>
            </div>
            <p className="text-gray-300 whitespace-pre-line">{order.notes || <span className="text-gray-500 italic">No notes added.</span>}</p>
          </section>
        </div>
      </div>

      {dialog === 'cancel' && <CancelDialog reference={order.reference} onClose={() => setDialog(null)} onConfirm={(reason) => transition('Cancelled', reason).catch(() => undefined)} />}
      {dialog === 'notes' && <NotesDialog order={order} onSaved={saved} onClose={() => setDialog(null)} />}
      {dialog === 'fulfillment' && <FulfillmentDialog order={order} onSaved={saved} onClose={() => setDialog(null)} />}
    </div>
  );
};

const BackLink: React.FC = () => (
  <Link to="/orders" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-4"><ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to orders</Link>
);

export default OrderDetailPage;
