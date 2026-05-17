import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
};

export const logout = () => signOut(auth);

// Test connection as required by guidelines
export async function testFirebaseConnection() {
  try {
    // Attempting to read a non-existent document just to check network connectivity
    await getDocFromServer(doc(db, 'system', 'ping'));
  } catch (error: any) {
    if (error?.message?.includes('offline')) {
      console.warn("Firebase client is offline. Sync may be delayed.");
    }
  }
}
