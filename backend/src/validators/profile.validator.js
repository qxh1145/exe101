import { z } from 'zod';

export const updateProfileSchema = z.object({
  major: z.string().trim().min(2, 'Major is required').max(100, 'Major is too long'),
  year: z.number().int().min(1, 'Invalid academic year').max(10, 'Invalid academic year'),
  age: z.number().int().min(16, 'You must be at least 16 years old').max(100, 'Invalid age'),
});
