'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { buttonVariants } from '@/components/ui/button-variants';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type AvatarCropDialogProps = {
  file: File;
  open: boolean;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

const VIEW = 280;

/**
 * Square crop: drag to pan, zoom slider, keyboard arrows nudge the crop.
 * Exports a WebP blob for upload (server still re-encodes).
 */
export function AvatarCropDialog({
  file,
  open,
  busy,
  onCancel,
  onConfirm,
}: AvatarCropDialogProps) {
  const t = useTranslations('Account.settings.avatar');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number } | null>(null);

  const draw = useEffectEvent(
    (img: HTMLImageElement, z: number, o: { x: number; y: number }) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return;
      }
      const side = Math.min(img.naturalWidth, img.naturalHeight) / z;
      const cx = img.naturalWidth / 2 + o.x;
      const cy = img.naturalHeight / 2 + o.y;
      const sx = Math.max(0, Math.min(img.naturalWidth - side, cx - side / 2));
      const sy = Math.max(0, Math.min(img.naturalHeight - side, cy - side / 2));
      ctx.clearRect(0, 0, VIEW, VIEW);
      ctx.drawImage(img, sx, sy, side, side, 0, 0, VIEW, VIEW);
    }
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      draw(img, 1, { x: 0, y: 0 });
    };
    img.src = url;
    return () => {
      URL.revokeObjectURL(url);
      imgRef.current = null;
    };
  }, [file, open, draw]);

  useEffect(() => {
    if (imgRef.current) {
      draw(imgRef.current, zoom, offset);
    }
  }, [zoom, offset, draw]);

  function exportBlob() {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    canvas.toBlob(
      (blob) => {
        if (blob) {
          onConfirm(blob);
        }
      },
      'image/webp',
      0.92
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !busy) {
          onCancel();
        }
      }}
    >
      <DialogContent variant="modal" className="gap-4">
        <DialogTitle className="text-lg">{t('cropTitle')}</DialogTitle>
        <DialogDescription>{t('cropHint')}</DialogDescription>
        <canvas
          ref={canvasRef}
          width={VIEW}
          height={VIEW}
          className="mx-auto size-[min(100%,280px)] cursor-grab rounded-full touch-none active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) {
              return;
            }
            const dx = e.clientX - drag.current.x;
            const dy = e.clientY - drag.current.y;
            drag.current = { x: e.clientX, y: e.clientY };
            setOffset((o) => ({ x: o.x - dx * 1.5, y: o.y - dy * 1.5 }));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onKeyDown={(e) => {
            const step = 8;
            if (e.key === 'ArrowLeft') {
              setOffset((o) => ({ ...o, x: o.x - step }));
            }
            if (e.key === 'ArrowRight') {
              setOffset((o) => ({ ...o, x: o.x + step }));
            }
            if (e.key === 'ArrowUp') {
              setOffset((o) => ({ ...o, y: o.y - step }));
            }
            if (e.key === 'ArrowDown') {
              setOffset((o) => ({ ...o, y: o.y + step }));
            }
          }}
          tabIndex={0}
          aria-label={t('cropCanvas')}
        />
        <label className="flex flex-col gap-1 text-sm">
          <span>{t('zoom')}</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={cn(buttonVariants())}
            disabled={busy}
            onClick={() => exportBlob()}
          >
            {busy ? t('uploading') : t('save')}
          </button>
          <button
            type="button"
            className={cn(buttonVariants({ variant: 'outline' }))}
            disabled={busy}
            onClick={onCancel}
          >
            {t('cancel')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
