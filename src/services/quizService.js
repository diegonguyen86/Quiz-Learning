import { db, firebase, generateShareCode } from './firebase';

export async function fetchUserQuizzes(userId) {
    if (!userId) return [];
    const snapshot = await db.collection("users").doc(userId).collection("my_quizzes").orderBy("createdAt", "desc").get();
    const quizzes = [];
    snapshot.forEach(doc => {
        const data = doc.data();
        quizzes.push({
            id: doc.id,
            ...data,
            refPath: data.refPath || null
        });
        // Auto-heal missing share codes in background
        if (!data.shareCode) {
            doc.ref.update({ shareCode: generateShareCode() }).catch(console.error);
        }
    });
    return quizzes;
}

export async function createQuiz(userId, title, questions) {
    const newQuiz = {
        title,
        questions,
        progress: 0,
        shareCode: generateShareCode(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection("users").doc(userId).collection("my_quizzes").add(newQuiz);
    return { id: docRef.id, ...newQuiz };
}

export async function updateQuiz(userId, quizId, patch) {
    await db.collection("users").doc(userId).collection("my_quizzes").doc(quizId).update(patch);
}

export async function deleteQuizDoc(userId, quizId) {
    await db.collection("users").doc(userId).collection("my_quizzes").doc(quizId).delete();
}

export async function resetQuizDoc(userId, quizId) {
    await db.collection("users").doc(userId).collection("my_quizzes").doc(quizId).update({
        progress: 0,
        sessionState: firebase.firestore.FieldValue.delete(),
        learnMode: firebase.firestore.FieldValue.delete()
    });
}

export async function refreshShareCodeDoc(userId, quizId) {
    const newCode = generateShareCode();
    await db.collection("users").doc(userId).collection("my_quizzes").doc(quizId).update({
        shareCode: newCode
    });
    return newCode;
}

export async function importCopyQuizByCode(userId, code) {
    const qSnapshot = await db.collectionGroup("my_quizzes").where("shareCode", "==", code.trim()).get();
    if (qSnapshot.empty) {
        throw new Error("Không tìm thấy bộ đề! Mã đã hết hạn hoặc không tồn tại.");
    }
    const data = qSnapshot.docs[0].data();
    const newQuiz = {
        title: data.title + " (Bản sao)",
        questions: data.questions || [],
        progress: 0,
        shareCode: generateShareCode(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    const docRef = await db.collection("users").doc(userId).collection("my_quizzes").add(newQuiz);
    return { id: docRef.id, ...newQuiz };
}

export async function joinClassroomByCode(userId, user, code, secSize = 12) {
    const qSnapshot = await db.collectionGroup("my_quizzes").where("shareCode", "==", code.trim()).get();
    if (qSnapshot.empty) {
        throw new Error("Mã lớp học không tồn tại hoặc đã bị đổi!");
    }

    const teacherDoc = qSnapshot.docs[0];
    const teacherData = teacherDoc.data();
    const totalSec = Math.ceil((teacherData.questions || []).length / secSize);

    const studentRef = teacherDoc.ref.collection("students").doc(userId);
    let savedProgress = 0;

    const studentDoc = await studentRef.get();
    if (studentDoc.exists) savedProgress = studentDoc.data().progress || 0;
    
    await studentRef.set({
        name: user.displayName || "Học sinh",
        email: user.email || "",
        progress: savedProgress,
        totalSections: totalSec,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    const localCheck = await db.collection("users").doc(userId).collection("my_quizzes").where("refPath", "==", teacherDoc.ref.path).get();
    if (localCheck.empty) {
        const newClassQuiz = {
            title: teacherData.title,
            isClassroom: true,
            refPath: teacherDoc.ref.path,
            progress: savedProgress,
            totalSections: totalSec,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        const added = await db.collection("users").doc(userId).collection("my_quizzes").add(newClassQuiz);
        return { id: added.id, ...newClassQuiz };
    } else {
        await localCheck.docs[0].ref.update({ progress: savedProgress });
        return { id: localCheck.docs[0].id, ...localCheck.docs[0].data(), progress: savedProgress };
    }
}

export async function fetchStudentsList(userId, quizId) {
    const snapshot = await db.collection("users").doc(userId).collection("my_quizzes").doc(quizId).collection("students").orderBy("lastActive", "desc").get();
    const students = [];
    snapshot.forEach(doc => {
        students.push({ id: doc.id, ...doc.data() });
    });
    return students;
}

export async function saveSessionState(userId, quizId, isStudentMode, refPath, stateData) {
    if (!userId || !quizId) return;
    try {
        const quizRef = db.collection("users").doc(userId).collection("my_quizzes").doc(quizId);
        quizRef.set({ sessionState: { ...stateData, timestamp: firebase.firestore.FieldValue.serverTimestamp() } }, { merge: true });
        if (isStudentMode && refPath) {
            db.doc(refPath).collection("students").doc(userId).set({
                sessionState: { ...stateData, timestamp: firebase.firestore.FieldValue.serverTimestamp() }
            }, { merge: true });
        }
    } catch (e) {
        console.error("Error saving session state:", e);
    }
}

export async function clearSessionState(userId, quizId, isStudentMode, refPath) {
    if (!userId || !quizId) return;
    try {
        const quizRef = db.collection("users").doc(userId).collection("my_quizzes").doc(quizId);
        quizRef.update({ sessionState: firebase.firestore.FieldValue.delete() }).catch(console.error);
        if (isStudentMode && refPath) {
            db.doc(refPath).collection("students").doc(userId).update({
                sessionState: firebase.firestore.FieldValue.delete()
            }).catch(console.error);
        }
    } catch (e) {
        console.error("Error clearing session state:", e);
    }
}
