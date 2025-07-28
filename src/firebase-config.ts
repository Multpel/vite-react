// src/firebase-config.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc4KaKwPYxJUiduqH1WzsHfWx4YEbS6aU",
  authDomain: "multpels-projects-vercel.firebaseapp.com",
  projectId: "multpels-projects-vercel",
  storageBucket: "multpels-projects-vercel.firebasestorage.app",
  messagingSenderId: "1038398020775",
  appId: "1:1038398020775:web:a91b76a386efb4936a0f82",
  measurementId: "G-PHXFWFNN3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Inicialize o Firestore e o exporte para ser usado em outros arquivos
export const db = getFirestore(app); 
export const auth = getAuth(app);

// Você pode exportar 'app' também, se precisar acessar outros serviços do Firebase futuramente
export default app;