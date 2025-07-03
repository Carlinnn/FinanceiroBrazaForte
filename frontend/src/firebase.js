// Importa as funções necessárias do SDK do Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Configuração do Firebase do projeto
const firebaseConfig = {
  apiKey: "AIzaSyDySCn8TG05aZipCLyWzcbidz6eXlGujkU",
  authDomain: "financeiro-ed3b4.firebaseapp.com",
  projectId: "financeiro-ed3b4",
  storageBucket: "financeiro-ed3b4.firebasestorage.app",
  messagingSenderId: "567842674155",
  appId: "1:567842674155:web:13a2a91e7af35b808875ae",
  measurementId: "G-WTT3FZHZC9"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export { app, analytics }; 