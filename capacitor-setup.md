# APK Generation Setup with Capacitor

## Option A: Capacitor (Recommended for React Apps)

### 1. Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android
npx cap init "Elite Car Shine" "com.elitecar.app"
```

### 2. Add Android Platform
```bash
npx cap add android
```

### 3. Build and Sync
```bash
npm run build
npx cap sync
npx cap open android
```

### 4. Generate APK in Android Studio
- Open Android Studio
- Build → Build Bundle(s) / APK(s) → Build APK(s)
- APK will be generated in `android/app/build/outputs/apk/`

## Option B: PWA Builder (Microsoft)

### 1. Use PWA Builder
- Go to https://www.pwabuilder.com/
- Enter your app URL
- Generate Android package
- Download APK directly

## Option C: Bubblewrap (Google)

### 1. Install Bubblewrap
```bash
npm install -g @bubblewrap/cli
```

### 2. Generate APK
```bash
bubblewrap init --manifest=https://yourdomain.com/manifest.json
bubblewrap build
```

## Option D: Manual APK Creation

### 1. Create Android Project Structure
```
android/
├── app/
│   ├── src/main/
│   │   ├── AndroidManifest.xml
│   │   ├── java/com/elitecar/app/
│   │   └── res/
│   └── build.gradle
└── build.gradle
```

### 2. Configure AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Elite Car Shine"
        android:theme="@style/AppTheme">
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:theme="@style/AppTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

## Option E: TWA (Trusted Web Activity)

### 1. Create TWA Project
```bash
git clone https://github.com/GoogleChrome/android-browser-helper.git
```

### 2. Configure TWA
- Use Android Studio
- Configure with your PWA URL
- Build APK

## Benefits of Each Option:

- **Capacitor**: Best for React apps, easy setup
- **PWA Builder**: No coding required, web-based
- **Bubblewrap**: Google's official tool
- **Manual**: Full control, custom features
- **TWA**: Lightweight, Chrome-based
