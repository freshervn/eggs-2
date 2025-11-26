# Firebase Setup Guide

## 1. Get Your Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to **Project Settings** (gear icon) > **General** tab
4. Scroll down to **Your apps** section
5. Click on the **Web** icon (`</>`) to add a web app
6. Copy the configuration values

## 2. Set Up Environment Variables

1. Create a `.env.local` file in the root of your project
2. Add your Firebase configuration:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 3. Enable Firebase Services

### Firestore Database
1. Go to **Firestore Database** in Firebase Console
2. Click **Create database**
3. Start in **test mode** (for development) or **production mode** (for production)
4. Choose a location for your database

### Authentication (Optional)
1. Go to **Authentication** in Firebase Console
2. Click **Get started**
3. Enable **Email/Password** sign-in method (or others as needed)

## 4. Usage Examples

### Using Firestore

```tsx
import { addDocument, getDocuments, queryHelpers } from "@/lib/firebase";

// Save an order
const orderId = await addDocument("orders", {
  items: cartItems,
  total: 100000,
  status: "pending",
  createdAt: new Date(),
});

// Get orders
const orders = await getDocuments("orders", [
  queryHelpers.orderBy("createdAt", "desc"),
  queryHelpers.limit(10),
]);
```

### Using Authentication

```tsx
import { signIn, signUp, onAuthChange } from "@/lib/firebase";

// Sign up
await signUp("user@example.com", "password123", "John Doe");

// Sign in
await signIn("user@example.com", "password123");

// Listen to auth changes
onAuthChange((user) => {
  if (user) {
    console.log("User is signed in:", user);
  }
});
```

## 5. Security Rules

### Option 1: Deploy Rules via Firebase CLI (Recommended)

1. Install Firebase CLI if you haven't:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done):
   ```bash
   firebase init firestore
   ```

4. Deploy the rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Option 2: Update Rules in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** > **Rules** tab
4. Copy and paste the rules from `firestore.rules` file
5. Click **Publish**

### Security Rules Files

- `firestore.rules` - Contains the security rules for development (allows all reads/writes)
- `firebase.json` - Firebase configuration file

**⚠️ Important:** The current rules allow all reads/writes for development. For production, update the rules to require authentication:

```javascript
match /orders/{orderId} {
  allow read, write: if request.auth != null;
}
```

