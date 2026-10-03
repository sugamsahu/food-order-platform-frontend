import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import OrderDetail from './OrderDetail';
import api from '../utils/api';
import { apiError, renderAt, signIn } from '../test/utils';
import type { OrderDetail as OrderDetailType, OrderStatus } from '../types';

vi.mock('../utils/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/api')>();
  return { ...actual, default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } };
});
const get = vi.mocked(api.get);
const post = vi.mocked(api.post);

const makeOrder = (status: OrderStatus): OrderDetailType => ({
  id: 7, reference: 'FO-000007', status, fulfillment_type: 'pickup', total: '96.00', subtotal: '96.00', currency: 'AED',
  created_at: '2026-10-01T10:00:00.000Z', delivery_address: null, notes: null,
  customer: { id: 1, name: 'Test Customer', email: 'customer@example.com', phone: null },
  items: [{ id: 1, food_id: 1, food_name: 'Margherita Pizza', unit_price: '48.00', quantity: 2, line_total: '96.00' }],
  status_history: [{ id: 1, from_status: null, to_status: 'Placed', actor_type: 'customer', actor_name: 'Test Customer', reason: null, created_at: '2026-10-01T10:00:00.000Z' }],
});

const open = (status: OrderStatus) => {
  signIn('operator');
  get.mockResolvedValue({ data: makeOrder(status) });
  return renderAt(<OrderDetail />, { path: '/orders/:id', route: '/orders/7' });
};

describe('Order detail page', () => {
  beforeEach(() => { get.mockReset(); post.mockReset(); });

  it('shows items, totals, customer and the status timeline', async () => {
    open('Placed');
    expect(await screen.findByRole('heading', { name: 'FO-000007' })).toBeInTheDocument();
    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('Test Customer')).toBeInTheDocument();
    expect(within(screen.getByRole('region', { name: 'Status timeline' })).getByText('Placed')).toBeInTheDocument();
  });

  it.each([
    ['Placed', ['Accept order', 'Cancel order']],
    ['Accepted', ['Start preparing', 'Cancel order']],
    ['Preparing', ['Mark ready', 'Cancel order']],
    ['Ready', ['Mark completed']],
  ] as [OrderStatus, string[]][])('offers only the allowed actions for a %s order', async (status, actions) => {
    open(status);
    await screen.findByRole('heading', { name: 'FO-000007' });
    const section = screen.getByRole('region', { name: 'Update status' });
    expect(within(section).getAllByRole('button').map((b) => b.textContent?.trim())).toEqual(actions);
  });

  it.each(['Completed', 'Cancelled'] as OrderStatus[])('offers no actions for a %s order', async (status) => {
    open(status);
    await screen.findByRole('heading', { name: 'FO-000007' });
    const section = screen.getByRole('region', { name: 'Update status' });
    expect(within(section).queryAllByRole('button')).toHaveLength(0);
    expect(section).toHaveTextContent('No further changes are possible');
  });

  it('sends the transition with the current status so stale views are detected', async () => {
    open('Placed');
    post.mockResolvedValue({ data: makeOrder('Accepted') });
    await userEvent.click(await screen.findByRole('button', { name: 'Accept order' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/orders/7/transitions', { from: 'Placed', to: 'Accepted', reason: undefined }));
    expect(await screen.findByText('Order FO-000007 is now Accepted')).toBeInTheDocument();
  });

  it('requires a reason to cancel and sends it to the server', async () => {
    open('Placed');
    post.mockResolvedValue({ data: makeOrder('Cancelled') });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));

    const dialog = await screen.findByRole('dialog', { name: 'Cancel order FO-000007' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel order' }));
    expect(await within(dialog).findByText('A reason is required to cancel an order')).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();

    await userEvent.type(within(dialog).getByLabelText('Reason for cancelling'), 'Kitchen closed');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel order' }));
    await waitFor(() => expect(post).toHaveBeenCalledWith('/orders/7/transitions', { from: 'Placed', to: 'Cancelled', reason: 'Kitchen closed' }));
  });

  it('shows a clear message when the order does not exist', async () => {
    signIn('admin');
    get.mockImplementation(() => Promise.reject(apiError(404, 'NOT_FOUND', 'Order not found')));
    renderAt(<OrderDetail />, { path: '/orders/:id', route: '/orders/999' });
    expect(await screen.findByRole('alert')).toHaveTextContent('This order does not exist.');
  });
});
