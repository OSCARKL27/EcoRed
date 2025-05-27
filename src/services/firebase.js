
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD8iFyt_O-NlrNV-AS6PwfJ4S36I2cXilA",
authDomain: "ecored-9051a.firebaseapp.com",
  projectId: "ecored-9051a",
  storageBucket: "ecored-9051a.firebasestorage.app",
  messagingSenderId: "501744681102",
  appId: "1:501744681102:web:c28f05ea9c6d1eeb3ec9df",
  measurementId: "G-0SN61YQ385"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // <-- ¡Asegúrate de incluir esto!