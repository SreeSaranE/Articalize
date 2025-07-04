# 📚 Article Saving App - Functional Specification

This document outlines the user flow and feature set for an app that helps users save, organize, and access article content efficiently.

---

## 🚀 App Overview

The app provides a minimal, clean interface for users to save articles in one central place. Key features include:
- Email-based signup and login
- Dashboard for saved articles
- Quick article saving and sharing
- AI-generated article summaries using DeepSeek API
- Custom collections to organize content

---

## 🔄 App Flow

### 1. **Welcome Screen**
- **Purpose**: Introduce the app with a clean, distraction-free UI.
- **UI Elements**:
  - App logo / title
  - “Sign Up” and “Log In” buttons
- **Next Step**: On sign-up, user proceeds to the dashboard.

---

### 2. **User Signup & Authentication**
- **Method**: Email + password-based signup
- **Security**: Use Firebase Auth or similar for authentication
- **Flow**:
  - Input email + password
  - Validation and confirmation
  - Redirect to Main Dashboard on success

---

### 3. **Main Dashboard**
- **Overview**: Central screen showing all user-saved articles.
- **UI Elements**:
  - Header with logo and profile menu
  - List of saved articles (title, favicon, date saved, collection tag)
  - Floating Action Button (FAB) for Quick Add
  - Tabs/Filters: `All Articles`, `Collections`, `Search`
- **Functionality**:
  - Scrollable list of saved articles
  - Tapping an article opens the summary view
  - Swipe actions: delete, move to collection

---

### 4. **Add Article**
#### a. **Quick Add**
- **How**: Tap "+" button (FAB) on dashboard
- **Input**: Paste article URL manually
- **Backend**:
  - Fetch metadata (title, favicon, etc.)
  - Generate summary using DeepSeek API
  - Save to default “Uncategorized” or selected collection

#### b. **Share Extension**
- **How**: User shares article link from other apps (e.g. browser, Twitter)
- **UI**:
  - Mini overlay to confirm save
  - Optional: choose a collection before saving

---

### 5. **Collections Management**
- **Purpose**: Organize saved articles into thematic or custom groups
- **UI Elements**:
  - “Collections” tab or side menu
  - List of user-created collections
  - “Create Collection” button
- **Functionality**:
  - Create, rename, delete collections
  - Assign articles to collections
  - View articles within a selected collection

---

### 6. **Article Detail View**
- **Access**: Tap any article from Dashboard, Search, or Collection
- **Features**:
  - **AI-generated summary** (via DeepSeek API)
  - Clean article title and source link
  - Option to:
    - Open in browser
    - Move to collection
    - Delete
- **Tech Integration**:
  - Call DeepSeek API with article URL to fetch summary
  - Cache summary for faster repeat access

---

### 7. **Search & Filtering**
- **Purpose**: Allow user to quickly find articles
- **Features**:
  - Search by title, URL, or summary text
  - Filter by collection or date added

---

## 🧠 Tech Stack Recommendations

- **Frontend**: React Native / Flutter
- **Backend**: Node.js or Firebase Functions
- **Database**: Firebase Firestore or Supabase
- **Authentication**: Firebase Auth
- **Article Parsing**: Mercury Parser, Microlink, or Readability.js
- **AI Summary**: DeepSeek API (text summarization)
- **Link Metadata**: OpenGraph scraper / link-preview API

---

## 📝 Additional Features (Future Scope)
- Offline access to saved articles
- Tags and custom labels
- Daily digest or summary email
- Reading progress tracking

---

## 🔐 Data Model Overview

### User
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "collections": ["tech", "health"]
}
