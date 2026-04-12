'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateProfile } from './actions';
import type { UpdateProfileInput } from './profile.schema';

interface ProfileFormProps {
  defaultValues: {
    name: string;
    image: string | null;
  };
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
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
      setMessage('Profile updated successfully.');
    } catch {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="image">Profile image URL</Label>
        <Input
          id="image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
        />
      </div>

      {message && <p className="text-sm text-muted-foreground">{message}</p>}

      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  );
}
