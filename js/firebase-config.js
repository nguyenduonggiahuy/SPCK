// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqDe-yGNB-TYlNVJz7dNUDcyOXr1OZ80s",
  authDomain: "spck-7fb30.firebaseapp.com",
  projectId: "spck-7fb30",
  storageBucket: "spck-7fb30.firebasestorage.app",
  messagingSenderId: "1054848808234",
  appId: "1:1054848808234:web:01408127ea587e76a71a53",
  measurementId: "G-RG8MMRPWWV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();