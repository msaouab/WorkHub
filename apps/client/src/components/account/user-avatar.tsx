'use client';

import { useState } from 'react';
import { colorFromId, initialsFromName } from '@/lib/initials';
import { cn } from '@/lib/utils';

type UserAvatarProps = {
  name: string;
  userId: string;
  image?: string | null;
  size?: 'sm' | 'lg';
  className?: string;
};

const SIZE_CLASS = {
  sm: 'size-7 text-[0.65rem]',
  lg: 'size-10 text-sm',
} as const;

export function UserAvatar({
  name,
  userId,
  image,
  size = 'sm',
  className,
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;
  const initials = initialsFromName(name);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-white',
        SIZE_CLASS[size],
        className
      )}
      style={showImage ? undefined : { backgroundColor: colorFromId(userId) }}
      aria-hidden={!showImage}
    >
      {showImage ? (
        <img
          src={image ?? ''}
          alt={name}
          className="size-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden>{initials}</span>
      )}
    </span>
  );
}
