/// src/firebase-config.ts
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // linha para importar o Firestore
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDc4KaKwPYxJUiduqH1WzsHfWx4YEbS6aU",
  authDomain: "multpels-projects-vercel.firebaseapp.com",
  projectId: "multpels-projects-vercel",
  storageBucket: "multpels-projects-vercel.appspot.com"
  messagingSenderId: "1038398020775",
  appId: "1:1038398020775:web:a91b76a386efb4936a0f82",
  measurementId: "G-PHXFWFNN3D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
// Inicialize o Firestore e o exporte para ser usado em outros arquivos
export const db = getFirestore(app); // <-- Adicione esta linha

// Você pode exportar 'app' também, se precisar acessar outros serviços do Firebase futuramente
export default app;