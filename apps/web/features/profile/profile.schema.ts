import { z } from 'zod';

import messages from '@/messages/en.json';

const v = messages.validation;

const NAME_MAX_LENGTH = 100;

export const updateProfileSchema = z.object({
  name: z.string().min(1, v.nameRequired).max(NAME_MAX_LENGTH, v.nameMaxLength),
  image: z.string().url(v.invalidUrl).optional().or(z.literal('')),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
