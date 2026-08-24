'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, X } from 'lucide-react';

interface Props {
  churchId: string;
  serviceId?: string;
  title: string;
  subtitle?: string;
}

/**
 * Shows a button that opens a modal with the signup-link QR code
 * for a church (and optionally a specific service).
 * The servant scans it → lands on /signup?church=..&service=..
 */
export default function SignupQr({ churchId, serviceId, title, subtitle }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const base = `${window.location.origin}/signup?church=${churchId}`;
    setUrl(serviceId ? `${base}&service=${serviceId}` : base);
  }, [churchId, serviceId]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs font-semibold rounded-xl px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 active:scale-[0.98] transition shrink-0"
      >
        <QrCode className="w-3.5 h-3.5" />
        دعوة
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 text-sm">دعوة خادم جديد</h3>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center active:scale-[0.95] transition"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <p className="text-sm font-bold text-gray-800">{title}</p>
            {subtitle && <p className="text-xs text-gray-400 mb-3">{subtitle}</p>}

            <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 inline-block mt-2">
              {url && <QRCodeSVG value={url} size={200} level="M" />}
            </div>

            <p className="mt-3 text-xs text-gray-400 leading-relaxed">
              الخادم يمسح الكود ده بالموبايل ويسجل حسابه — هيتربط تلقائياً بالكنيسة والخدمة، وبعدها توافق عليه من صفحة المستخدمين.
            </p>

            <button
              onClick={copyLink}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] border border-gray-200 text-gray-700 font-semibold rounded-xl py-3 text-xs transition"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              {copied ? 'تم النسخ!' : 'نسخ رابط التسجيل'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
