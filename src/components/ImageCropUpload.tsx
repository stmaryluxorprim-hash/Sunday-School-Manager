'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Camera, Loader2, X, Check, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * ImageCropUpload
 * - Pick an image, pan (drag) & zoom (slider / wheel / pinch) inside a square
 *   crop window, then export a small WebP (default 512px, q=0.8) and upload
 *   it to the public `app-pictures` Supabase Storage bucket.
 * - Calls onUploaded(publicUrl) so the caller can persist it to the DB.
 */
interface Props {
  /** storage path without extension, e.g. "churches/abc123" */
  storagePath: string;
  /** called with the public URL (cache-busted) after upload */
  onUploaded: (url: string) => Promise<void> | void;
  /** output size in px (square). Keep small to save storage. */
  outputSize?: number;
  /** trigger element; if omitted a small camera button is rendered */
  children?: React.ReactNode;
  /** round preview (avatars) */
  round?: boolean;
}

const VIEW = 260; // crop viewport display size (px)

export default function ImageCropUpload({
  storagePath,
  onUploaded,
  outputSize = 512,
  children,
  round = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // transform state
  const [scale, setScale] = useState(1);
  const [minScale, setMinScale] = useState(1);
  const offset = useRef({ x: 0, y: 0 });
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);

  const clampOffset = useCallback((s: number) => {
    const img = imgRef.current;
    if (!img) return;
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    offset.current.x = Math.min(0, Math.max(VIEW - w, offset.current.x));
    offset.current.y = Math.min(0, Math.max(VIEW - h, offset.current.y));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, VIEW, VIEW);
    ctx.drawImage(
      img,
      offset.current.x,
      offset.current.y,
      img.naturalWidth * scale,
      img.naturalHeight * scale
    );
  }, [scale]);

  useEffect(() => {
    if (open) draw();
  }, [open, scale, draw]);

  function pickFile() {
    setError(null);
    fileRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const min = VIEW / Math.min(img.naturalWidth, img.naturalHeight);
      setMinScale(min);
      setScale(min);
      // center
      offset.current = {
        x: (VIEW - img.naturalWidth * min) / 2,
        y: (VIEW - img.naturalHeight * min) / 2,
      };
      setOpen(true);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => setError('تعذر قراءة الصورة');
    img.src = url;
  }

  function setScaleAround(newScale: number, cx: number, cy: number) {
    const s0 = scale;
    const s1 = Math.max(minScale, Math.min(minScale * 8, newScale));
    // keep point (cx,cy) stable
    offset.current.x = cx - ((cx - offset.current.x) / s0) * s1;
    offset.current.y = cy - ((cy - offset.current.y) / s0) * s1;
    clampOffset(s1);
    setScale(s1);
  }

  // pointer handlers (drag + pinch)
  function onPointerDown(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 2 && pinchStart.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = canvasRef.current!.getBoundingClientRect();
      const cx = (a.x + b.x) / 2 - rect.left;
      const cy = (a.y + b.y) / 2 - rect.top;
      setScaleAround((pinchStart.current.scale * dist) / pinchStart.current.dist, cx, cy);
    } else if (pointers.current.size === 1) {
      offset.current.x += cur.x - prev.x;
      offset.current.y += cur.y - prev.y;
      clampOffset(scale);
      draw();
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  }

  function onWheel(e: React.WheelEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    setScaleAround(
      scale * (e.deltaY < 0 ? 1.1 : 0.9),
      e.clientX - rect.left,
      e.clientY - rect.top
    );
  }

  async function save() {
    const img = imgRef.current;
    if (!img) return;
    setSaving(true);
    setError(null);
    try {
      // export crop → webp
      const out = document.createElement('canvas');
      out.width = outputSize;
      out.height = outputSize;
      const ctx = out.getContext('2d')!;
      ctx.imageSmoothingQuality = 'high';
      const sx = -offset.current.x / scale;
      const sy = -offset.current.y / scale;
      const sw = VIEW / scale;
      ctx.drawImage(img, sx, sy, sw, sw, 0, 0, outputSize, outputSize);

      const blob = await new Promise<Blob | null>((res) =>
        out.toBlob(res, 'image/webp', 0.8)
      );
      if (!blob) throw new Error('فشل ضغط الصورة');

      const supabase = createClient();
      const path = `${storagePath}.webp`;
      const { error: upErr } = await supabase.storage
        .from('app-pictures')
        .upload(path, blob, { upsert: true, contentType: 'image/webp' });
      if (upErr) throw upErr;

      const { data } = supabase.storage.from('app-pictures').getPublicUrl(path);
      // cache-bust so the new picture shows immediately
      await onUploaded(`${data.publicUrl}?v=${Date.now()}`);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الرفع');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />

      <button type="button" onClick={pickFile} className="contents">
        {children ?? (
          <span className="inline-flex items-center gap-1 text-xs bg-gray-50 text-gray-600 rounded-xl px-3 py-2 font-semibold hover:bg-gray-100 active:scale-[0.98] transition">
            <Camera className="w-3.5 h-3.5" />
            صورة
          </span>
        )}
      </button>

      {error && !open && <p className="text-red-600 text-xs mt-1">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">قص الصورة</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center">
              <div
                className={`overflow-hidden border-2 border-blue-500 ${round ? 'rounded-full' : 'rounded-2xl'}`}
                style={{ width: VIEW, height: VIEW }}
              >
                <canvas
                  ref={canvasRef}
                  width={VIEW}
                  height={VIEW}
                  className="touch-none cursor-move"
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onWheel={onWheel}
                />
              </div>
            </div>

            {/* zoom slider */}
            <div className="flex items-center gap-2 mt-4" dir="ltr">
              <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="range"
                min={minScale}
                max={minScale * 8}
                step={minScale / 50}
                value={scale}
                onChange={(e) => setScaleAround(Number(e.target.value), VIEW / 2, VIEW / 2)}
                className="flex-1 accent-blue-600"
              />
              <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
            </div>

            <p className="text-[11px] text-gray-400 text-center mt-1">
              اسحب الصورة لتحريكها · قرّب بإصبعين أو بالشريط
            </p>

            {error && (
              <p className="text-red-600 text-xs bg-red-50 rounded-xl p-2.5 mt-3">{error}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition disabled:opacity-50 active:scale-[0.98]"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                حفظ الصورة
              </button>
              <button
                type="button"
                onClick={pickFile}
                className="inline-flex items-center justify-center gap-1 bg-gray-50 text-gray-600 font-semibold rounded-xl px-4 text-sm hover:bg-gray-100 transition"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
