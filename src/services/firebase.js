import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

export const firebaseConfig = {
    apiKey: "AIzaSyBUQiXAFAp2o9C4G_YgQbGqrVoTqO0hpWI",
    authDomain: "quiz-learning-24d17.firebaseapp.com",
    projectId: "quiz-learning-24d17",
    storageBucket: "quiz-learning-24d17.firebasestorage.app",
    messagingSenderId: "116470163667",
    appId: "1:116470163667:web:c4d2b54b6fba1f68fdcc26"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Enable offline persistence
try {
    db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code !== 'failed-precondition' && err.code !== 'unimplemented') {
            console.warn('Firestore persistence error:', err);
        }
    });
} catch (e) {
    // Ignore if already active
}

export function generateShareCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    let result = 'QL-';
    for (let i = 0; i < 8; i++) {
        result += chars[randomBytes[i] % chars.length];
    }
    return result;
}

export { firebase };
