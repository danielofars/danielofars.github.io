// =========================================================
// auth.js
// -----------------------------------------------------------
// Login com Google (Firebase Auth) + salvar/carregar currículos
// (Firestore). Tudo isso é OPCIONAL: se firebase-config.js não
// tiver credenciais reais, o site continua funcionando 100%
// sem login (gerar PDF na hora, nada é enviado a servidor).
//
// Este arquivo é um módulo ES (type="module") e expõe uma API
// simples em `window.CurriculoAuth` para o app.js (script comum)
// poder usar.
// =========================================================

import { firebaseConfig, firebaseConfigured } from "./firebase-config.js";

window.CurriculoAuth = {
  disponivel: false,
  usuarioAtual: null,
  login: async () => {
    alert("Login com Google ainda não foi configurado neste site. Veja DEPLOY.md para ativar.");
  },
  logout: async () => {},
  salvarCurriculo: async () => {
    throw new Error("Login não configurado.");
  },
  listarCurriculos: async () => [],
  carregarCurriculo: async () => null,
  excluirCurriculo: async () => {}
};

if (firebaseConfigured) {
  try {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const {
      getAuth,
      GoogleAuthProvider,
      signInWithPopup,
      signOut,
      onAuthStateChanged
    } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const {
      getFirestore,
      collection,
      doc,
      setDoc,
      getDoc,
      getDocs,
      deleteDoc,
      serverTimestamp,
      query,
      orderBy
    } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    function resumosDoUsuario(uid) {
      return collection(db, "usuarios", uid, "curriculos");
    }

    window.CurriculoAuth = {
      disponivel: true,
      usuarioAtual: null,

      login: async () => {
        const resultado = await signInWithPopup(auth, provider);
        return resultado.user;
      },

      logout: async () => {
        await signOut(auth);
      },

      // dados: objeto com todos os campos do formulário
      // id: opcional — se enviado, atualiza um currículo existente
      salvarCurriculo: async (dados, id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) throw new Error("Você precisa estar logado para salvar.");
        const referencia = id
          ? doc(db, "usuarios", uid, "curriculos", id)
          : doc(resumosDoUsuario(uid));
        // "nome" aqui é só o rótulo usado na lista "Meus currículos" —
        // combina nome + objetivo para diferenciar currículos diferentes
        // que a mesma pessoa tenha salvo (ex: para vagas diferentes).
        const rotulo = dados.nome
          ? dados.nome + (dados.objetivo ? " — " + dados.objetivo : "")
          : "Currículo sem nome";
        await setDoc(referencia, {
          dados,
          nome: rotulo,
          atualizadoEm: serverTimestamp()
        }, { merge: true });
        return referencia.id;
      },

      listarCurriculos: async () => {
        const uid = auth.currentUser?.uid;
        if (!uid) return [];
        const q = query(resumosDoUsuario(uid), orderBy("atualizadoEm", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      },

      carregarCurriculo: async (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return null;
        const snap = await getDoc(doc(db, "usuarios", uid, "curriculos", id));
        return snap.exists() ? snap.data().dados : null;
      },

      excluirCurriculo: async (id) => {
        const uid = auth.currentUser?.uid;
        if (!uid) return;
        await deleteDoc(doc(db, "usuarios", uid, "curriculos", id));
      }
    };

    onAuthStateChanged(auth, (usuario) => {
      window.CurriculoAuth.usuarioAtual = usuario;
      window.dispatchEvent(new CustomEvent("curriculo-auth-mudou", { detail: usuario }));
    });
  } catch (erro) {
    console.error("Falha ao iniciar Firebase:", erro);
  }
}

// Avisa o app.js que o módulo de autenticação terminou de carregar
// (configurado ou não), para liberar a interface.
window.dispatchEvent(new CustomEvent("curriculo-auth-pronto"));
