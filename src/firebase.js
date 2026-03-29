import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // ⬅️ add this

const firebaseConfig = {
  apiKey: "AIzaSyCR0ucNxAD_RJBJ_kF1LL1c-MlCHBJaJtM",
  authDomain: "pawmart-91eec.firebaseapp.com",
  projectId: "pawmart-91eec",
  storageBucket: "pawmart-91eec.firebasestorage.app",
  messagingSenderId: "983942705382",
  appId: "1:983942705382:web:8f76497fbd769596b08b27",
  measurementId: "G-3QYF32CRMH"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); // ⬅️ add this