# NovaStream TV - Android TV Medya & CloudStream Oynatıcı

NovaStream TV, Android TV Box, Smart TV ve web tarayıcıları için tasarlanmış yüksek performanslı, donanım hızlandırmalı (HW+) IPTV ve CloudStream eklenti merkezidir.

---

## 🚀 Özellikler

- **📺 Xtream Codes & Canlı TV**: Canlı yayınlar, EPG ve kanal kategorileri.
- **🎬 VOD & Dizi Kütüphanesi**: Sezon/bölüm seçimi, fragman ve poster desteği.
- **🔌 CloudStream Eklenti & Repo Yöneticisi**: GitHub depolarından (WioSpor, WioSinema, Kekik vb.) tek tıkla eklenti yükleme ve içerik çekme.
- **⚡ Çift Oynatıcı Motoru (Dual Engine)**:
  - **ExoPlayer**: Düşük gecikmeli adaptif HLS ve hızlı kanal geçişi.
  - **LibVLC**: Gelişmiş kodek desteği (AC3, DTS, MKV onarımı).
- **🕹️ Android TV Kumanda Desteği**: D-Pad (Yukarı, Aşağı, Sol, Sağ, OK, Geri) ve sanal TV kumandası.
- **🛡️ CORS & Yayın Proxy**: Sunucu taraflı stream tünelleme ile engelsiz yayın deneyimi.
- **📦 Arabellek & Gecikme Optimizasyonu**: Canlı TV ve VOD için özelleştirilebilir buffer boyutları (Ultra Düşük Gecikme, Standart, Kararlı).

---

## 🛠️ Kurulum & Çalıştırma

### Gereksinimler
- Node.js 18+ veya 20+
- npm veya bun

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Geliştirme Modunda Başlatın
```bash
npm run dev
```
Uygulama varsayılan olarak `http://localhost:3000` portunda açılacaktır.

### 3. Üretim (Production) Derlemesi & Başlatma
```bash
npm run build
npm start
```

---

## 📁 Proje Dizin Yapısı

```
├── server.ts                   # Express proxy sunucusu (Xtream API, Stream Proxy, CloudStream Repo Resolver)
├── index.html                  # Android TV 10-foot UI HTML şablonu
├── package.json                # Proje bağımlılıkları ve komutları
├── tsconfig.json               # TypeScript yapılandırması
├── vite.config.ts              # Vite ve Tailwind CSS entegrasyonu
└── src/
    ├── App.tsx                 # Ana uygulama ve durum yönetimi
    ├── main.tsx                # React başlangıç noktası
    ├── index.css               # TV odak ve arayüz stilleri
    ├── types/                  # Veri modelleri ve tip tanımları
    ├── services/               # Xtream API, CloudStream ve LocalStorage servisleri
    ├── constants/              # Varsayılan oynatıcı ve kanal ayarları
    └── components/             # React bileşenleri
        ├── LivePlayer.tsx      # ExoPlayer & HLS video oynatıcı
        ├── NavigationSidebar.tsx # TV Leanback sol menü
        ├── CloudStreamManager.tsx # Repo ve eklenti yöneticisi
        ├── XtreamConfigModal.tsx  # Sunucu yapılandırma penceresi
        ├── SettingsModal.tsx      # Motor, arabellek ve ekran ayarları
        ├── SeriesDetailModal.tsx  # Dizi ve bölüm detay modalı
        └── VirtualRemote.tsx      # Sanal Android TV uzaktan kumandası
```

---

## 📺 Android TV Box Cihazlara Yükleme & APK Yapma

### 📱 Yöntem A: Capacitor ile APK Çıkarma (Önerilen)
1. `npm install @capacitor/core @capacitor/cli @capacitor/android`
2. `npm run build`
3. `npx cap add android && npx cap copy`
4. `npx cap open android` (Android Studio'da açılır, **Build > Build APK** ile `.apk` oluşturulur).
*Ayrıntılı adımlar ve TV kumanda Manifest yapılandırmaları için `APK_REHBERI.md` dosyasını inceleyebilirsiniz.*

### 🌐 Yöntem B: Yerel Ağ veya TV Tarayıcısı ile Kullanma
1. `npm run dev` veya `npm run build && npm start` çalıştırın.
2. Android TV Box'ınızdaki TV tarayıcısından (TV Bro, JioPages vb.) sunucu adresini açıp tam ekran yapın.
