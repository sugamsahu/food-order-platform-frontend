import * as z from 'zod';

// Validation for the add/edit food form. Kept out of Foods.tsx so that file only exports components (fast refresh).
export const foodSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be 120 characters or fewer'),
  category: z.string().trim().min(1, 'Category is required').max(60, 'Category must be 60 characters or fewer'),
  price: z.string().trim()
    .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Enter a valid price with at most 2 decimals, for example 9.50')
    .refine((v) => Number(v) > 0, 'Price must be greater than zero'),
  image_url: z.string().trim().refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'Must start with http:// or https://'),
  description: z.string().trim().max(1000, 'Description must be 1000 characters or fewer'),
  is_available: z.boolean(),
});
export type FoodFormValues = z.infer<typeof foodSchema>;
