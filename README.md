# Taka Khata / টাকা খাতা

A simple, offline-first phone app where one person writes the money received and the money spent, and always sees how much money should be left.

**Live app:** https://alexander007-xd.github.io/money-management/

The app lives in the [`taka-khata/`](taka-khata) folder. It is a PWA: install it once from the browser, then it works without internet. All data stays on the phone.

---

## ফোনে ইনস্টল করবেন যেভাবে (বাংলা)

১. ফোনের Chrome ব্রাউজারে এই লিংকটি খুলুন: https://alexander007-xd.github.io/money-management/
২. উপরে ডানদিকে তিনটি ডট (⋮) চাপুন, তারপর **"Add to Home screen"** বা **"হোম স্ক্রিনে যোগ করুন"** চাপুন।
৩. **"Install"** বা **"ইনস্টল"** চাপুন। অ্যাপটি ফোনের হোম স্ক্রিনে আইকন হিসেবে চলে আসবে।
৪. এখন থেকে ইন্টারনেট ছাড়াই অ্যাপটি খুলতে পারবেন; সব তথ্য শুধু এই ফোনেই থাকবে।
৫. বন্ধুকে দিতে চাইলে উপরের লিংকটি কপি করে WhatsApp-এ পাঠিয়ে দিন — তারাও একইভাবে ইনস্টল করতে পারবে।

## How to install on your phone (English)

1. Open this link in Chrome on your phone: https://alexander007-xd.github.io/money-management/
2. Tap the three dots (⋮) at the top right, then tap **"Add to Home screen"**.
3. Tap **"Install"**. The app appears on your home screen as an icon.
4. From then on it opens without internet, and all data stays only on this phone.
5. To share it, copy the link above and send it on WhatsApp — your friend installs it the same way.

---

## Development

```bash
cd taka-khata
npm install       # first time only
npm run dev       # local dev server (http://127.0.0.1:5173/)
npm test          # all tests
npm run typecheck # TypeScript only
npm run build     # production build into taka-khata/dist/
npm run preview   # serve the production build
```

`npm run build` uses the GitHub Pages base path `/money-management/`, so the build is served at <http://localhost:4173/money-management/> with `npm run preview`.

### Deploying

```bash
cd taka-khata
npm run build
# publish dist/ to the gh-pages branch of this repository
```

Pages is served from the `gh-pages` branch root. The design and data rules live in [`taka-khata/docs/`](taka-khata/docs).
