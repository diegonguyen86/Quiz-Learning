const window = { history: {} };
const document = { getElementById: () => ({ style: {}, classList: { add: ()=>{}, remove: ()=>{} }, value: '', innerHTML: '', addEventListener: ()=>{} }), addEventListener: ()=>{} };
const tailwind = { config: {} };
const localStorage = { getItem: ()=>{}, setItem: ()=>{} };
const pdfjsLib = { GlobalWorkerOptions: {} };
const firebase = { apps: [], initializeApp: ()=>{}, auth: ()=>{ return { onAuthStateChanged: ()=>{} } }, firestore: ()=>{ return { collection: ()=>{} } } };
let currentUser = null;
let db = null;
        tailwind.config = { darkMode: 'class' }
    


