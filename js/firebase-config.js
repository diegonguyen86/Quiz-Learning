/**
 * Firebase Initialization & Auth Configuration
 */
import { state } from './state.js';
import { showToast } from './ui.js';

export const firebaseConfig = {
    apiKey: "AIzaSyBUQiXAFAp2o9C4G_YgQbGqrVoTqO0hpWI",
    authDomain: "quiz-learning-24d17.firebaseapp.com",
    projectId: "quiz-learning-24d17",
    storageBucket: "quiz-learning-24d17.firebasestorage.app",
    messagingSenderId: "116470163667",
    appId: "1:116470163667:web:c4d2b54b6fba1f68fdcc26"
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

export const auth = firebase.auth();
export const db = firebase.firestore();

// Enable offline persistence if supported for fast instant responses
try {
    db.enablePersistence({ synchronizeTabs: true }).catch(err => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support offline persistence');
        }
    });
} catch (e) {
    // Ignore if already enabled
}

export function saveSessionStateToFirebase() {
    if (!state.currentUser || !state.activeQuizId || state.queue.length === 0 || state.currentSection >= state.TOTAL_SECTIONS) return;
    const quizScreen = document.getElementById('quiz-screen');
    const resultScreen = document.getElementById('result-screen');
    if (quizScreen?.classList.contains('hidden') && resultScreen?.classList.contains('hidden')) return;

    const sessionState = {
        currentSection: state.currentSection,
        queue: state.queue,
        mistakes: state.mistakes,
        currentQIndexInQueue: state.currentQIndexInQueue,
        isReviewMode: state.isReviewMode,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
        const quizRef = db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId);
        quizRef.set({ sessionState: sessionState }, { merge: true });
        if (state.isStudentMode && state.studentClassRef) {
            state.studentClassRef.set({ sessionState: sessionState }, { merge: true });
        }
    } catch(e) { 
        console.error("Error saving session state", e); 
    }
}

export async function clearSessionStateFromFirebase() {
    if (!state.currentUser || !state.activeQuizId) return;
    try {
        const quizRef = db.collection("users").doc(state.currentUser.uid).collection("my_quizzes").doc(state.activeQuizId);
        quizRef.update({ sessionState: firebase.firestore.FieldValue.delete() }).catch(e => console.error(e));
        if (state.isStudentMode && state.studentClassRef) {
            state.studentClassRef.update({ sessionState: firebase.firestore.FieldValue.delete() }).catch(e => console.error(e));
        }
    } catch(e) { 
        console.error("Error clearing session state", e); 
    }
}

export function generateShareCode() { 
    return 'QL-' + Math.random().toString(36).substring(2, 10).toUpperCase(); 
}
