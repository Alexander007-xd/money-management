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

## Android app (APK)

The same app also installs as a normal Android app. You do not need Play Store.

### বাংলা

১. এই লিংকটি খুলুন: https://github.com/alexander007-xd/money-management/actions/workflows/android-apk.yml — তারপর সবচেয়ে নতুন সফল (সবুজ ✓) রানের উপরে চাপুন।
২. নিচে **Artifacts** অংশে **taka-khata-apk** চাপুন। একটি `.zip` নামবে; ভেতরে `app-release.apk` আছে।
৩. ফোনে `.zip` খুলে `app-release.apk`-এ চাপুন। "Install unknown apps" জিজ্ঞাসা করলে Settings-এ গিয়ে আপনার ব্রাউজার/ফাইল ম্যানেজারের জন্য এটি চালু করুন, তারপর ফিরে এসে আবার ইনস্টল চাপুন।
৪. নতুন সংস্করণ আসলে **আগে More → Backup থেকে ব্যাকআপ সেভ করুন**, তারপর নতুন APK ইনস্টল করুন। ইনস্টল করলে পুরোনো অ্যাপের তথ্য মুছে যায় না, তবে ব্যাকআপ রাখা নিরাপদ।
৫. অ্যাপ ইনস্টল হলে ব্রাউজারের লিংক আর দরকার নেই — হোম স্ক্রিনের আইকন থেকেই খুলবে, ইন্টারনেট ছাড়াও চলবে।

Release করার সময় (`v` দিয়ে শুরু হওয়া tag) APK টি সরাসরি Releases পেজেও পাওয়া যাবে।

### English

1. Open https://github.com/alexander007-xd/money-management/actions/workflows/android-apk.yml and tap the newest successful (green ✓) run.
2. Under **Artifacts**, tap **taka-khata-apk**. A `.zip` downloads; inside it is `app-release.apk`.
3. On the phone, open the `.zip` and tap `app-release.apk`. If Android asks about "Install unknown apps", open Settings, allow it for your browser/file manager, come back and tap install again.
4. Before installing a newer version, **save a backup from More → Backup** first. Installing over the old app keeps your data, but a backup is the safe habit.
5. Once installed you no longer need the browser link: open the app from the home-screen icon, and it works without internet.

When a build is tagged with `v…`, the APK is also attached to the Releases page.

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
