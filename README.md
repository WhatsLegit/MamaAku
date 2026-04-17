# Mama Aku Semeii Aloe Wellness Hub

Modern glassmorphism wellness website with Firebase backend.

## Quick Start

1. Open `index.html` in browser.

## Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project.
3. Enable **Authentication** > Email/Password.
4. Enable **Firestore Database** > Start in test mode (later secure).
5. Enable **Storage**.
6. Copy config from Project Settings > SDK setup > Config object.
7. Replace `firebaseConfig` in `js/firebase.js`.
8. Create collections:
   - `products` (name, price, description, image)
   - `testimonials` (name, message, rating, photo, approved: false)
   - `business_apps`, `contacts`, `users`
9. **Firestore Rules** (import firestore.rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```
10. **Storage Rules** (import storage.rules):
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

## Admin Access
Signup with email ending `@admin.com` (demo) or add role in Firestore.

## Features
- Responsive glassmorphism design
- Full auth (login/signup/reset)
- Dynamic products/testimonials
- Cart (localStorage)
- Admin CRUD
- Forms save to Firestore
- Uses existing images/ for backgrounds

## Preview
`npx live-server .` or Live Server extension.

Enjoy your wellness hub! 🌿
