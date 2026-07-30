# KEMET | Build Your Legacy


تطبيق ومتجر إلكتروني فاخر لبراند **KEMET** مبني بأحدث التقنيات لتقديم تجربة تسوق راقية وسريعة جداً.

---

## 🛠️ التقنيات والمحرك الفني (Tech Stack):

- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Design System**: Pure Custom CSS (Nile Obsidian Theme `#05070C` & KEMET Gold `#D4AF37`)
- **Typography**: Cairo (Arabic) & Syne / Plus Jakarta Sans (English)
- **State Management**: React Context (`AppContext.jsx`) with localStorage persistence
- **Database Prep**: `@supabase/supabase-js`

---

## 📂 هيكلية المشروع (Project Structure):

```text
kemet/
├── public/
│   └── assets/             # صور الأطقم والشعارات والأيقونات الرسمية
├── src/
│   ├── app/                # Next.js App Router Pages & Layouts
│   │   ├── layout.jsx      # Root Layout & Metadata SEO
│   │   ├── page.jsx        # الصفحة الرئيسية (الأكثر مبيعاً 🔥)
│   │   ├── providers.jsx   # Client-side App Context & Shell
│   │   ├── category/       # صفحات الأقسام والبحث الفوري
│   │   ├── product/        # صفحة تفاصيل المنتج وزوم الصور
│   │   ├── checkout/       # صفحة الدفع وتأكيد الشحن
│   │   ├── my-orders/      # صفحة طلباتي ومتابعة حالة الشحنة
│   │   ├── track-order/    # صفحة تتبع شحنة البريد المصري
│   │   ├── our-story/      # صفحة قصة كيميت
│   │   ├── return-policy/  # سياسة الضمان والاسترجاع
│   │   ├── error.jsx       # مكون التعامل مع الأخطاء
│   │   └── not-found.jsx   # صفحة 404 المخصصة بشعار كيميت
│   ├── components/         # المكونات المجددة (Navbar, Footer, ProductCard, etc.)
│   ├── context/            # إدارة الحالة وتغيير اللغة والمود السريع
│   ├── data/               # بيانات المنتجات والكلمات المفتاحية والترجمة
│   └── styles/             # الملف الرئيسي للتنسيقات global.css
├── package.json
└── README.md
```

---

## 🚀 تشغيل المشروع محلياً (Local Development):

### 1. تثبيت الحزم (Install Dependencies):
```bash
npm install
```

### 2. تشغيل سيرفر التطوير (Run Development Server):
```bash
npm run dev
```
افتح الرابط في المتصفح: [http://localhost:3000](http://localhost:3000)

### 3. بناء نسخة الإنتاج (Production Build):
```bash
npm run build
npm start
```

---

## 👑 حقوق العلامة التجارية:
جميع الحقوق محفوظة kemet © 2026
