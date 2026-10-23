/**
 * State Management for Quiz Learning
 */
export const state = {
    currentUser: null,
    quizzesCache: [], // Cached list of quizzes for instant optimistic UI
    isDashboardLoaded: false,

    activeQuizId: null,
    activeQuizTitle: '',
    editQuizId: null,
    isStudentMode: false,
    studentClassRef: null,
    globalSessionState: null,

    // Quiz Execution State
    SEC_SIZE: 12,
    ALL_QUESTIONS: [],
    TOTAL_SECTIONS: 0,
    currentSection: 0,
    queue: [],
    currentQIndexInQueue: 0,
    mistakes: [],
    isReviewMode: false,
    selectedOptions: [],
    hasSubmitted: false,

    // Preview / Import Flow
    pendingParsedQuestions: [],
    pendingQuizTitle: '',
    hiddenAIText: '',

    // UI state
    currentLearnQuizId: null,
    searchFilter: '',
};

export function setQuizzesCache(quizzes) {
    state.quizzesCache = quizzes;
    state.isDashboardLoaded = true;
}

export function getQuizFromCache(quizId) {
    return state.quizzesCache.find(q => q.id === quizId) || null;
}

export function removeQuizFromCache(quizId) {
    state.quizzesCache = state.quizzesCache.filter(q => q.id !== quizId);
}

export function updateQuizInCache(quizId, patch) {
    const idx = state.quizzesCache.findIndex(q => q.id === quizId);
    if (idx !== -1) {
        state.quizzesCache[idx] = { ...state.quizzesCache[idx], ...patch };
    }
}
