'use client';

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, ChevronDown, ChevronUp } from 'lucide-react';

export default function ChildQrCode({ code, name }: { code: string; name: string }) {
  const [open, setOpen] = useState(false);

  return (
    <section id="child-qr" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 active:bg-gray-50 transition"
      >
        <span className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-indigo-600" />
          </span>
          <span className="text-sm font-bold text-gray-800">كود QR للمخدوم</span>
        </span>
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-5 flex flex-col items-center">
          <div className="bg-white border-2 border-gray-100 rounded-2xl p-4">
            <QRCodeSVG value={code} size={180} level="M" />
          </div>
          <p className="mt-3 text-sm font-bold text-gray-800">{name}</p>
          <p className="text-xs text-gray-400 font-mono" dir="ltr">{code}</p>
          <p className="mt-2 text-xs text-gray-400 text-center">
            امسح الكود بالماسح لتسجيل الحضور
          </p>
        </div>
      )}
    </section>
  );
}
