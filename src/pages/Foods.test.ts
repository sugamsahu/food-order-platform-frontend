import { foodSchema } from './foodSchema';

const valid = { name: 'Soup', category: 'Soups', price: '4.50', image_url: '', description: '', is_available: true };
const errorsFor = (input: object) => {
  const r = foodSchema.safeParse(input);
  return r.success ? {} : Object.fromEntries(r.error.issues.map((i) => [i.path.join('.'), i.message]));
};

describe('food form validation', () => {
  it('accepts a valid food', () => {
    expect(foodSchema.safeParse(valid).success).toBe(true);
    expect(foodSchema.safeParse({ ...valid, price: '10', image_url: 'https://example.com/a.jpg' }).success).toBe(true);
  });

  it.each(['0', '-1', '1.234', 'abc', '', '1,5'])('rejects the price %j with a field error', (price) => {
    expect(errorsFor({ ...valid, price })).toHaveProperty('price');
  });

  it('requires a name and a category, and an http(s) image URL', () => {
    expect(errorsFor({ ...valid, name: '  ' })).toHaveProperty('name');
    expect(errorsFor({ ...valid, category: '' })).toHaveProperty('category');
    expect(errorsFor({ ...valid, image_url: 'ftp://x' })).toHaveProperty('image_url');
  });
});
