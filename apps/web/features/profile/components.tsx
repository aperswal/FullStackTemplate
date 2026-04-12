'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from './actions';
import { trackEvent } from '@/lib/analytics';
import type { UpdateProfileInput } from './profile.schema';

interface ProfileFormProps {
  defaultValues: {
    name: string;
    image: string | null;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const t = useTranslations('profile');
  const [name, setName] = useState(defaultValues.name);
  const [image, setImage] = useState(defaultValues.image ?? '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const input: UpdateProfileInput = { name, image: image || undefined };
      await updateProfile(input);
      setMessage(t('profileUpdated'));
      trackEvent('profile_updated');
    } catch {
      setMessage(t('profileUpdateFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t('nameLabel')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">{t('profileImageUrl')}</Label>
        <Input
          id="image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder={t('profileImagePlaceholder')}
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? t('saving') : t('saveChanges')}
      </Button>
    </form>
  );
}
