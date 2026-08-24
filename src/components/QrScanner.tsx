'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { createClient } from '@/lib/supabase/client';
import {
  CheckCircle2,
  XCircle,
  Star,
  Camera,
  CameraOff,
  Keyboard,
  Loader2,
} from 'lucide-react';
import type { Child } from '@/lib/types';

interface Props {
  churchId: string;
}

type ScanResult =
  | { status: 'success'; child: Child; already: boolean }
  | { status: 'notfound'; code: string }
  | null;

export default function QrScanner({ churchId }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult>(null);
  const [manualCode, setManualCode] = useState('');
  const [busy, setBusy] = useState(false);

  const handleCode = useCallback(
    async (rawCode: string) => {
      if (processingRef.current) return;
      processingRef.current = true;
      setBusy(true);

      const code = rawCode.trim();
      const supabase = createClient();

      const { data: child } = await supabase
        .from('children')
        .select('*')
        .eq('church_id', churchId)
        .eq('child_code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (!child) {
        setResult({ status: 'notfound', code });
        if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
      } else {
        const { error } = await supabase.from('attendance').insert({
          church_id: churchId,
          child_id: child.id,
          service_id: child.service_id,
        });
        const already = !!error && (error as { code?: string }).code === '23505';
        setResult({ status: 'success', child: child as Child, already });
        if (navigator.vibrate) navigator.vibrate(already ? 60 : [40, 30, 40]);
      }

      setBusy(false);
      // Allow next scan after a short cooldown
      setTimeout(() => {
        processingRef.current = false;
      }, 1500);
    },
    [churchId]
  );

  async function startCamera() {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decoded) => handleCode(decoded),
        () => {}
      );
      setCameraOn(true);
    } catch {
      setCameraError('تعذر فتح الكاميرا — تأكد من منح الإذن أو استخدم الإدخال اليدوي');
    }
  }

  const stopCamera = useCallback(async () => {
    const s = scannerRef.current;
    if (s) {
      try {
        await s.stop();
        s.clear();
      } catch {}
      scannerRef.current = null;
    }
    setCameraOn(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  async function submitManual(e: React.FormEvent) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await handleCode(manualCode);
    setManualCode('');
  }

  return (
    <div className="space-y-4">
      {/* Camera area */}
      <section className="bg-gray-900 rounded-3xl overflow-hidden relative min-h-[280px] flex items-center justify-center">
        <div id="qr-reader" className="w-full" />
        {!cameraOn && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <Camera className="w-8 h-8 text-white" />
            </span>
            {cameraError ? (
              <p className="text-red-300 text-sm">{cameraError}</p>
            ) : (
              <p className="text-gray-300 text-sm">امسح QR code الخاص بالمخدوم لتسجيل حضوره</p>
            )}
            <button
              onClick={startCamera}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-6 py-3 text-sm transition flex items-center gap-2"
            >
              <Camera className="w-4 h-4" /> تشغيل الكاميرا
            </button>
          </div>
        )}
        {cameraOn && (
          <button
            onClick={stopCamera}
            className="absolute top-3 left-3 bg-black/50 text-white rounded-xl p-2.5"
            aria-label="إيقاف الكاميرا"
          >
            <CameraOff className="w-5 h-5" />
          </button>
        )}
      </section>

      {/* Result card */}
      {busy && (
        <section className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Loader2 className="w-5 h-5 animate-spin" /> جاري التحقق...
        </section>
      )}

      {result?.status === 'success' && !busy && (
        <section
          className={`rounded-2xl border p-5 flex items-center gap-4 ${
            result.already ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
          }`}
        >
          {result.child.picture_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={result.child.picture_url}
              alt=""
              className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <span
              className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${
                result.already ? 'bg-amber-100' : 'bg-green-100'
              }`}
            >
              <CheckCircle2
                className={`w-7 h-7 ${result.already ? 'text-amber-600' : 'text-green-600'}`}
              />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-800 truncate">{result.child.name}</p>
            <p
              className={`text-sm font-semibold ${
                result.already ? 'text-amber-700' : 'text-green-700'
              }`}
            >
              {result.already ? 'مسجل حضوره اليوم بالفعل' : '✓ تم تسجيل الحضور'}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-500" /> {result.child.points} نقطة
            </p>
          </div>
        </section>
      )}

      {result?.status === 'notfound' && !busy && (
        <section className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center gap-4">
          <span className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <XCircle className="w-7 h-7 text-red-500" />
          </span>
          <div>
            <p className="font-bold text-red-700">كود غير معروف</p>
            <p className="text-sm text-red-600" dir="ltr">{result.code}</p>
          </div>
        </section>
      )}

      {/* Manual entry */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-bold text-gray-500 mb-2 flex items-center gap-1.5">
          <Keyboard className="w-4 h-4" /> إدخال يدوي
        </p>
        <form onSubmit={submitManual} className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            dir="ltr"
            placeholder="C-001"
            className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          <button
            disabled={busy || !manualCode.trim()}
            className="bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl px-5 text-sm transition disabled:opacity-50"
          >
            تسجيل
          </button>
        </form>
      </section>
    </div>
  );
}
