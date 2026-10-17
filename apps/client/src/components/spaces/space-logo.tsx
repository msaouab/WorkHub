'use client';

import { useState } from 'react';
import type { SpaceLogo as SpaceLogoUrls } from '@work-hub/contracts';
import { colorFromId, initialsFromName } from '@/lib/initials';
import { cn } from '@/lib/utils';

type SpaceLogoProps = {
  name: string;
  spaceId: string;
  logo?: SpaceLogoUrls | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const SIZE_CLASS = {
  sm: 'size-6 text-[0.6rem]',
  md: 'size-8 text-xs',
  lg: 'size-24 text-2xl',
} as const;

export function SpaceLogo({
  name,
  spaceId,
  logo,
  size = 'md',
  className,
}: SpaceLogoProps) {
  const [failed, setFailed] = useState(false);
  const src = size === 'lg' ? logo?.url256 : logo?.url64;
  const showImage = Boolean(src) && !failed;
  const initials = initialsFromName(name);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl font-semibold text-white',
        SIZE_CLASS[size],
        className
      )}
      style={showImage ? undefined : { backgroundColor: colorFromId(spaceId) }}
    >
      {showImage && src ? (
        <img
          src={src}
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
