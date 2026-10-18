# 📚 Articalize

[![Expo SDK 57](https://img.shields.io/badge/Expo-SDK%2057-000020.svg?logo=expo&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB.svg?logo=react&logoColor=black)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

**Articalize** is a minimal, offline-first reading list app that lets you save, organize, and read web articles without clutter. Built with React Native and Expo, it includes **Bring-Your-Own-Key (BYOK)** AI summarization powered directly by Google Gemini.

No accounts, no third-party servers, no tracking.

---

## ✨ Features

- **Clean Article Extraction** – Strips ads, scripts, and clutter locally using `@mozilla/readability`. Dedicated fast-path for Wikipedia pages.
- **System Share Target (Android)** – Share links directly from Chrome, Twitter, or other apps into Articalize to auto-save articles.
- **BYOK AI Summaries** – Plug in your Google Gemini API key to generate concise takeaways and key significance notes on demand.
- **Collections & Organization** – Group articles into collections with list or grid views. Search and filter by read, unread, or bookmarked.
- **Privacy & Local Storage** – All content stays on your device. Your Gemini key is securely stored in the native device keystore (`expo-secure-store`).
- **Backup & Restore** – Export your entire library as a single JSON file and import it anytime.
- **Adaptive Dark Mode** – Minimalist UI designed for comfortable reading in light and dark mode.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- [Expo Go](https://expo.dev/go) on your phone, or an Android/iOS emulator

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/SreeSaranE/Articalize.git
cd Articalize

# Install dependencies
npm install

# Start the app
npx expo start
```

Press `a` for Android, `i` for iOS, or scan the QR code using Expo Go.

---

## 🔑 Setting Up AI Summaries (Optional)

1. Get a free API key from [Google AI Studio](https://aistudio.google.com/).
2. Open **Articalize** > **Settings** > **API**.
3. Paste your API key. Keys are stored locally on your device's keystore and only communicated directly to Google's API.

---

## 🛠️ Tech Stack

- **Framework**: [Expo SDK 57](https://docs.expo.dev/) + [React Native 0.86](https://reactnative.dev/)
- **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based)
- **Parser**: [`linkedom`](https://github.com/WebReflection/linkedom) & [`@mozilla/readability`](https://github.com/mozilla/readability)
- **AI**: [Google Gemini API](https://ai.google.dev/) (Direct client-side BYOK)
- **Storage**: [`AsyncStorage`](https://github.com/react-native-async-storage/async-storage) & [`expo-secure-store`](https://docs.expo.dev/versions/latest/sdk/securestore/)

---

## 📜 Useful Commands

```bash
npm run start       # Start dev server
npm run lint        # Run ESLint
npm run typecheck   # Typecheck TypeScript
```

---

## 📄 License

[MIT](./LICENSE)
