# منصة إدارة خدمات الكنيسة ⛪

Multi-tenant PWA لإدارة خدمات الكنائس والمخدومين والحضور والنقاط.

## Project Overview
- **Name**: Church Services Manager (Sunday School Manager)
- **Stack**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + Supabase
- **Architecture**: Multi-tenant (كل كنيسة = tenant منفصل) with RBAC
- **PWA**: قابل للتثبيت على الموبايل مع دعم أوفلاين أساسي
- **GitHub**: https://github.com/stmaryluxorprim-hash/Sunday-School-Manager
- **Deploy**: Vercel (via GitHub integration)

## الأدوار (RBAC)
| الدور | الصلاحيات |
|---|---|
| `app_owner` | إدارة كل الكنائس والمستخدمين على المنصة |
| `church_manager` | إدارة كنيسته: الخدمات، الخدام، المخدومين |
| `service_manager` | إدارة خدمته والمخدومين والحضور |
| `servant` | تسجيل الحضور والنقاط وإدارة بيانات المخدومين |

## بيانات المخدوم (Child)
كود المخدوم (فريد داخل الكنيسة) · الاسم · تاريخ الميلاد · الهاتف · العنوان · ملاحظات · عدد مرات الحضور (تلقائي) · النقاط (تلقائي من سجل النقاط) · الصورة (Supabase Storage)

## Data Architecture
- **Tables**: `churches` (tenants), `profiles` (users+roles), `services`, `service_members`, `children`, `attendance`, `points_log`
- **Isolation**: Row Level Security (RLS) — كل استعلام مقيد بـ `church_id` الخاص بالمستخدم
- **Triggers**: تحديث تلقائي لعداد الحضور والنقاط
- **Storage**: bucket `children-pictures` لصور المخدومين

## URIs
| المسار | الوصف | الحد الأدنى للدور |
|---|---|---|
| `/login`, `/signup` | الدخول والتسجيل | عام |
| `/dashboard` | الرئيسية والإحصائيات | servant |
| `/dashboard/children` (`?q=بحث`) | قائمة المخدومين + بحث | servant |
| `/dashboard/children/new` | إضافة مخدوم | servant |
| `/dashboard/children/[id]` | ملف المخدوم + حضور + نقاط | servant |
| `/dashboard/children/[id]/edit` | تعديل مخدوم | servant |
| `/dashboard/attendance` | تسجيل حضور جماعي سريع | servant |
| `/dashboard/services` | إدارة الخدمات | service_manager |
| `/dashboard/users` | إدارة المستخدمين والأدوار | church_manager |
| `/dashboard/churches` | إدارة الكنائس (tenants) | app_owner |

## 🚀 خطوات التشغيل

### 1. Supabase
1. أنشئ مشروع جديد على [supabase.com](https://supabase.com)
2. افتح **SQL Editor** وشغّل محتوى `supabase/migrations/0001_initial_schema.sql`
3. سجّل أول حساب من التطبيق، ثم شغّل من SQL Editor:
   ```sql
   update public.profiles set role = 'app_owner'
     where id = (select id from auth.users where email = 'بريدك@هنا');
   ```
4. (اختياري) عطّل تأكيد البريد: Authentication → Providers → Email → Confirm email = OFF

### 2. التشغيل محلياً
```bash
cp .env.example .env.local   # واملأ بيانات Supabase
npm install
npm run dev
```

### 3. Deploy على Vercel
1. من [vercel.com](https://vercel.com) → **Add New Project** → استورد ريبو `Sunday-School-Manager`
2. أضف Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. اضغط **Deploy** — وكل push على `main` هيعمل deploy تلقائي

## User Guide
1. **مالك التطبيق**: ينشئ الكنائس من صفحة "الكنائس"، ويعيّن مدير لكل كنيسة من "المستخدمون"
2. **مدير الكنيسة**: ينشئ الخدمات، ويربط الخدام الجدد بكنيسته ويحدد أدوارهم
3. **الخادم**: يضيف المخدومين، يسجل الحضور اليومي (زر واحد لكل طفل)، ويضيف النقاط

## Features Completed ✅
- Multi-tenant isolation عبر RLS
- RBAC بأربعة أدوار
- CRUD كامل للمخدومين مع رفع الصور
- تسجيل حضور جماعي سريع + سجل حضور لكل مخدوم
- نظام نقاط مع سجل تدقيق
- PWA (manifest + service worker + أيقونات)
- واجهة عربية RTL متجاوبة للموبايل

## Not Yet Implemented 🔜
- تقارير وإحصائيات متقدمة (حضور شهري، رسوم بيانية)
- ربط الخدام بخدمات محددة في الواجهة (`service_members` جاهز في الداتابيز)
- تصدير البيانات (Excel/CSV)
- إشعارات (أعياد ميلاد، غياب متكرر)
- مسح QR code لتسجيل الحضور بكود المخدوم

## Last Updated
2026-08-24
