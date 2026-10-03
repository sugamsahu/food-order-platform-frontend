import { ACTION_LABEL, ORDER_STATUSES, TRANSITIONS, allowedNext } from './orderStatus';

describe('order status workflow (UI side)', () => {
  it('offers exactly the transitions in the brief', () => {
    expect(allowedNext('Placed')).toEqual(['Accepted', 'Cancelled']);
    expect(allowedNext('Accepted')).toEqual(['Preparing', 'Cancelled']);
    expect(allowedNext('Preparing')).toEqual(['Ready', 'Cancelled']);
    expect(allowedNext('Ready')).toEqual(['Completed']);
  });

  it('offers nothing for terminal states', () => {
    expect(allowedNext('Completed')).toEqual([]);
    expect(allowedNext('Cancelled')).toEqual([]);
  });

  it('has an action label for every status and a rule for every status', () => {
    for (const s of ORDER_STATUSES) {
      expect(ACTION_LABEL[s]).toBeTruthy();
      expect(TRANSITIONS).toHaveProperty(s);
    }
  });
});
