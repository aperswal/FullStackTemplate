import { z } from 'zod';

import messages from '@/messages/en.json';

const v = messages.validation;

export const updateProfileSchema = z.object({
  name: z.string().min(1, v.nameRequired).max(100, v.nameMaxLength),
  image: z.string().url(v.invalidUrl).optional().or(z.literal('')),
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
