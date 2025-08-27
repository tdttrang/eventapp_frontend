// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 

const firebaseConfig = {
  apiKey: "AIzaSyBqu-CwJLiDdMfJ3NM1WwT89LyMfcf4vtQ",
  authDomain: "eventapp2503.firebaseapp.com",
  projectId: "eventapp2503",
  storageBucket: "eventapp2503.firebasestorage.app",
  messagingSenderId: "986556347009",
  appId: "1:986556347009:web:5c63e384b20b6a8423d380",
  measurementId: "G-6LBEHF715R"
};

// khoi tao firebase
const app = initializeApp(firebaseConfig);

// khoi tao auth (de login google, email, password)
export const auth = getAuth(app);
