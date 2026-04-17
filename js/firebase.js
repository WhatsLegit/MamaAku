// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyATkI87sxRp1pX0uS89jB1W_1XZNh-_vqE",
  authDomain: "mama-aku.firebaseapp.com",
  projectId: "mama-aku",
  storageBucket: "mama-aku.firebasestorage.app",
  messagingSenderId: "31700825134",
  appId: "1:31700825134:web:357670906a984453a6dbbf",
};

// Cloudinary Config
const CLOUDINARY_CLOUD = 'dfu4nqt7d';
const CLOUDINARY_PRESET = 'Mama-aku';

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signOut, sendPasswordResetEmail, onAuthStateChanged }
  from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, getDoc, doc,
         setDoc, updateDoc, deleteDoc, query, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

// Single Firebase app — works reliably on all browsers including iOS Safari
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Alias for admin panel — same db, same auth
export const adminAuth = auth;
export const adminDb = db;

// ===== PUBLIC AUTH =====
export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: cred.user };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

export async function signup(email, password, phone) {
  try {
    const { where } = await import('https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js');
    const phoneQuery = await getDocs(query(collection(db, 'users'), where('phone', '==', phone)));
    if (!phoneQuery.empty) return { success: false, error: 'This phone number is already registered.' };
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await setDoc(doc(db, 'users', cred.user.uid), { email, phone, createdAt: serverTimestamp() });
    return { success: true, user: cred.user };
  } catch (e) {
    if (e.code === 'auth/email-already-in-use') return { success: false, error: 'This email is already registered.' };
    return { success: false, error: e.message };
  }
}

export async function logout() { await signOut(auth); }
export async function resetPassword(email) { await sendPasswordResetEmail(auth, email); }
export function onAuthChange(callback) { onAuthStateChanged(auth, callback); }
export function onAdminAuthChange(callback) { onAuthStateChanged(auth, callback); }

// ===== ADMIN ROLE CHECK =====
export async function checkAdminRole(uid) {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch (e) {
    return false;
  }
}

// ===== ADMIN LOGIN =====
export async function adminLogin(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const isAdmin = await checkAdminRole(cred.user.uid);
    if (!isAdmin) {
      await signOut(auth);
      return { success: false, error: 'Access denied. This account does not have admin privileges.' };
    }
    // Store admin flag in localStorage so admin.html can verify quickly
    localStorage.setItem('mama_admin_uid', cred.user.uid);
    return { success: true, user: cred.user };
  } catch (e) {
    let msg = 'Login failed. Please check your credentials.';
    if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') msg = 'Invalid email or password.';
    else if (e.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
    return { success: false, error: msg };
  }
}

export async function adminLogoutFn() {
  localStorage.removeItem('mama_admin_uid');
  await signOut(auth);
}

// ===== FIRESTORE HELPERS =====
export async function getCollection(collectionName, filters = []) {
  let q = collection(db, collectionName);
  if (filters.length) q = query(q, ...filters);
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addDocToCollection(collectionName, data) {
  return await addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() });
}

export async function updateDocInCollection(collectionName, id, data) {
  await updateDoc(doc(db, collectionName, id), data);
}

export async function deleteDocFromCollection(collectionName, id) {
  await deleteDoc(doc(db, collectionName, id));
}

// Admin Firestore helpers — same as public ones (single app)
export const adminGetCollection = getCollection;
export const adminUpdateDoc = updateDocInCollection;
export const adminDeleteDoc = deleteDocFromCollection;
export const adminAddDoc = addDocToCollection;

// ===== CLOUDINARY UPLOAD =====
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST', body: formData
  });
  if (!res.ok) throw new Error('Cloudinary upload failed');
  const data = await res.json();
  return data.secure_url;
}
