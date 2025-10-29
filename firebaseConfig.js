// Fichier : firebaseConfig.js

import { initializeApp } from 'firebase/app';

// Importe les services dont tu auras besoin
// On les prépare pour plus tard
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Ta configuration copiée depuis la console
const firebaseConfig = {
  apiKey: "AIzaSyDInB6Q-EWfyd8gHAwnUdgLotYqfKt3ZFY",
  authDomain: "bricapattes.firebaseapp.com",
  projectId: "bricapattes",
  storageBucket: "bricapattes.firebasestorage.app",
  messagingSenderId: "813493023796",
  appId: "1:813493023796:web:a55f1dfe1c1447569f8661"
};

// Initialise Firebase
const app = initializeApp(firebaseConfig);

// Exporte les services pour les utiliser partout dans ton app
export const auth = getAuth(app);       // Pour l'authentification (connexion, inscription)
export const db = getFirestore(app);      // Pour la base de données (les annonces)
export const storage = getStorage(app); // Pour stocker les images (photos des articles)