import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  image: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const profileResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  image: z.string().nullable(),
  role: z.enum(['free', 'pro', 'admin']),
  createdAt: z.coerce.date(),
});

export type ProfileResponse = z.infer<typeof profileResponseSchema>;
