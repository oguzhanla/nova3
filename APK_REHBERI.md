# NovaStream TV - Android TV APK Üretim Rehberi 📺📱

Bu rehber, indirdiğiniz bu React projesini **Android TV Box, Google TV veya Android telefonunuza yüklenebilir bir `.apk` dosyasına** nasıl dönüştüreceğinizi adım adım anlatır.

---

## 🥇 YÖNTEM 1: Capacitor ile APK Üretme (En Kolay ve Tavsiye Edilen)

Bu yöntem sektör standardıdır. Projeyi 5 dakikada yerel bir Android Studio projesine dönüştürür.

### Adım 1: ZIP'i Çıkarın ve Bağımlılıkları Yükleyin
```bash
unzip novastream-tv.zip
cd novastream-tv
npm install
```

### Adım 2: Capacitor Araçlarını Ekleyin
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### Adım 3: Web Projesini Derleyin
```bash
npm run build
```

### Adım 4: Android Platformunu Ekleyin ve Senkronize Edin
```bash
npx cap add android
npx cap copy
```
*Bu komut proje dizininde hazır bir `android/` klasörü oluşturur.*

### Adım 5: Android TV Desteğini Etkinleştirin (Çok Önemli!)
Android TV ana ekranında simgenin görünmesi için `android/app/src/main/AndroidManifest.xml` dosyasını açın:

1. `<application ...>` etiketi içerisine `android:usesCleartextTraffic="true"` ve `android:banner="@mipmap/ic_launcher"` ekleyin:
```xml
<application
    android:allowBackup="true"
    android:icon="@mipmap/ic_launcher"
    android:banner="@mipmap/ic_launcher"
    android:label="NovaStream TV"
    android:usesCleartextTraffic="true"
    android:roundIcon="@mipmap/ic_launcher_round"
    android:supportsRtl="true"
    android:theme="@style/AppTheme">
```

2. `<activity ...>` içine TV başlatıcısını ekleyin:
```xml
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
    <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
</intent-filter>
```

3. Dokunmatik ekran şartını kaldırın (TV kumandası için):
```xml
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
```

### Adım 6: APK'yı Çıkarın
```bash
npx cap open android
```
- Bu komut projeyi **Android Studio**'da açar.
- Üst menüden **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)** seçeneğine tıklayın.
- 1-2 dakika içinde `android/app/build/outputs/apk/debug/app-debug.apk` dosyanız hazır olacaktır!
- Bu `.apk` dosyasını USB belleğe atıp Android TV Box'ınıza takarak doğrudan yükleyebilirsiniz.

---

## 🥈 YÖNTEM 2: Online / Kodsuz Araçlar (WebToApp / Website 2 APK)

Eğer bilgisayarınızda Android Studio yoksa veya kodla uğraşmak istemiyorsanız:

1. **Önce NovaStream TV'yi Yayına Alın:**
   - Projeyi Vercel, Render veya Railway gibi ücretsiz bir hostinge deploy edin (veya mevcut AI Studio canlı URL'sini kullanın).
2. **Online APK Oluşturucu Kullanın:**
   - [WebToApp.design](https://www.webtoapp.design/) veya [PWABuilder](https://www.pwabuilder.com/) sitesine gidin.
   - Sitenizin URL'sini girin.
   - Uygulama adını "NovaStream TV" yapın.
   - **Download APK** butonuna basarak doğrudan hazır `.apk` dosyasını indirin.

---

## 🥉 YÖNTEM 3: PWA Olarak TV Tarayıcısına Ekleme (Kurulumsuz)

1. Android TV Box'ınızdaki **TV Bro**, **JioPages** veya **Chrome** tarayıcısını açın.
2. NovaStream TV adresinize gidin.
3. Tarayıcı menüsünden **"Ana Ekrana Ekle" (Add to Home Screen)** seçeneğini seçin.
4. Artık TV ana ekranınızda bağımsız bir uygulama gibi açılacaktır.

---

## 💡 İpuçları & Önemli Ayarlar
- **IPTV Yayınları (HTTP/HTTPS):** Birçok Xtream sunucusu HTTP üzerinden yayın yaptığı için `usesCleartextTraffic="true"` izni zorunludur.
- **TV Kumandası:** NovaStream TV içinde dahili klavye/kumanda (D-Pad, Yukarı, Aşağı, OK, Geri) algılayıcıları hazır bulunmaktadır.
