// =========================================================
// firebase-config.js
// -----------------------------------------------------------
// PREENCHA os valores abaixo com as credenciais do SEU projeto
// Firebase. Veja o passo a passo completo em DEPLOY.md
// ("1. Criar o projeto Firebase").
//
// Enquanto os valores continuarem como "SEU_..." abaixo, o site
// funciona normalmente para gerar currículos em PDF — apenas o
// login com Google e o salvamento na nuvem ficam desativados
// (o botão "Entrar com Google" mostra um aviso).
// =========================================================

export const firebaseConfig = {
  apiKey: "AIzaSyCZAuIIoPdeKPlNPv808QAs3Fbdm97NN6M",
  authDomain: "curriculo-facil-60e4b.firebaseapp.com",
  projectId: "curriculo-facil-60e4b",
  storageBucket: "curriculo-facil-60e4b.firebasestorage.app",
  messagingSenderId: "308899999776",
  appId: "1:308899999776:web:918237ebfaacdc57e68c45"
};

// Detecta automaticamente se as credenciais já foram preenchidas.
export const firebaseConfigured = !Object.values(firebaseConfig).some(
  (valor) => typeof valor === "string" && valor.startsWith("SEU_")
);
