// =========================================================
// app.js
// -----------------------------------------------------------
// Lógica do formulário em etapas (wizard), montagem da prévia
// do currículo e integração com login/salvamento (via
// window.CurriculoAuth, definido em auth.js).
// Nada aqui depende de servidor: sem login, tudo roda 100% no
// navegador do usuário.
// =========================================================

(function () {
  "use strict";

  const NOMES_ETAPAS = [
    "Dados pessoais",
    "Objetivo",
    "Experiência",
    "Escolaridade",
    "Cursos",
    "Habilidades",
    "Revisão"
  ];
  const TOTAL_ETAPAS = NOMES_ETAPAS.length;

  const el = (id) => document.getElementById(id);

  // ---- Elementos principais ----
  const telaInicial = el("tela-inicial");
  const btnComecar = el("btn-comecar");
  const form = el("form-curriculo");
  const progressoWrap = document.querySelector(".progresso-wrap");
  const passoAtualEl = el("passo-atual");
  const passoNomeEl = el("passo-nome");
  const barraProgresso = el("barra-progresso");
  const progressoPreenchido = el("progresso-preenchido");
  const btnVoltar = el("btn-voltar");
  const btnAvancar = el("btn-avancar");
  const areaAnuncios = el("aria-anuncios");

  const listaExperiencias = el("lista-experiencias");
  const btnAddExperiencia = el("btn-add-experiencia");
  const templateExperiencia = el("template-experiencia");

  const listaCursos = el("lista-cursos");
  const btnAddCurso = el("btn-add-curso");
  const templateCurso = el("template-curso");

  const previewCurriculo = el("preview-curriculo");
  const completudeCurriculo = el("completude-curriculo");
  const btnGerarPdf = el("btn-gerar-pdf");
  const btnCompartilharWhatsapp = el("btn-compartilhar-whatsapp");
  const btnSalvarNuvem = el("btn-salvar-nuvem");
  const statusAcao = el("status-acao");
  const btnFonteMais = el("btn-fonte-mais");
  const btnFonteMenos = el("btn-fonte-menos");

  const btnLogin = el("btn-login");
  const btnLogout = el("btn-logout");
  const btnMeusCurriculos = el("btn-meus-curriculos");
  const userInfo = el("user-info");
  const userAvatar = el("user-avatar");
  const userName = el("user-name");
  const areaMeusCurriculos = el("area-meus-curriculos");
  const listaCurriculosSalvos = el("lista-curriculos-salvos");

  let etapaAtual = 1;
  let idCurriculoAtual = null; // preenchido quando edita um currículo salvo

  // =========================================================
  // Navegação entre telas
  // =========================================================

  function anunciar(texto) {
    areaAnuncios.textContent = texto;
  }

  function limparFormulario() {
    form.reset();
    listaExperiencias.innerHTML = "";
    listaCursos.innerHTML = "";
    criarItemRepetivel(templateExperiencia, listaExperiencias);
    idCurriculoAtual = null;
  }

  function iniciarFormulario() {
    telaInicial.hidden = true;
    telaInicial.classList.remove("ativa");
    form.hidden = false;
    progressoWrap.hidden = false;
    irParaEtapa(1);
  }

  // Mostra a tela inicial já com a lista de currículos salvos visível,
  // acessível a qualquer momento pelo botão "Meus currículos" no cabeçalho.
  function irParaMeusCurriculos() {
    form.hidden = true;
    progressoWrap.hidden = true;
    document.querySelectorAll(".etapa").forEach((f) => (f.hidden = true));
    telaInicial.hidden = false;
    telaInicial.classList.add("ativa");
    carregarListaDeCurriculos();
    telaInicial.querySelector("h1")?.focus();
    anunciar("Seus currículos salvos");
  }

  function voltarTelaInicial() {
    telaInicial.hidden = false;
    telaInicial.classList.add("ativa");
    progressoWrap.hidden = true;
    document.querySelectorAll(".etapa").forEach((f) => (f.hidden = true));
    btnVoltar.hidden = true;
    btnAvancar.hidden = true;
    telaInicial.querySelector("h1").focus?.();
  }

  function irParaEtapa(n) {
    document.querySelectorAll(".etapa").forEach((f) => {
      f.hidden = Number(f.dataset.etapa) !== n;
    });
    etapaAtual = n;

    passoAtualEl.textContent = n;
    passoNomeEl.textContent = NOMES_ETAPAS[n - 1];
    const percentual = Math.round((n / TOTAL_ETAPAS) * 100);
    barraProgresso.setAttribute("aria-valuenow", percentual);
    progressoPreenchido.style.width = percentual + "%";

    btnVoltar.hidden = false;
    btnAvancar.hidden = n === TOTAL_ETAPAS;

    anunciar(`Etapa ${n} de ${TOTAL_ETAPAS}: ${NOMES_ETAPAS[n - 1]}`);

    const primeiroCampo = document.querySelector(`.etapa[data-etapa="${n}"] input, .etapa[data-etapa="${n}"] select, .etapa[data-etapa="${n}"] textarea`);
    if (primeiroCampo) primeiroCampo.focus();

    if (n === TOTAL_ETAPAS) {
      renderizarPreview();
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function etapaValida(n) {
    const fieldset = document.querySelector(`.etapa[data-etapa="${n}"]`);
    const camposObrigatorios = fieldset.querySelectorAll("[required]");
    for (const campo of camposObrigatorios) {
      if (!campo.checkValidity()) {
        campo.reportValidity();
        campo.focus();
        return false;
      }
    }
    return true;
  }

  btnComecar.addEventListener("click", () => {
    limparFormulario();
    iniciarFormulario();
  });

  btnAvancar.addEventListener("click", () => {
    if (!etapaValida(etapaAtual)) return;
    if (etapaAtual < TOTAL_ETAPAS) irParaEtapa(etapaAtual + 1);
  });

  btnVoltar.addEventListener("click", () => {
    if (etapaAtual === 1) {
      voltarTelaInicial();
    } else {
      irParaEtapa(etapaAtual - 1);
    }
  });

  // =========================================================
  // Campos repetíveis: Experiência e Cursos
  // =========================================================

  function criarItemRepetivel(template, lista) {
    const fragmento = template.content.cloneNode(true);
    const item = fragmento.querySelector("[data-item-experiencia], [data-item-curso]");
    item.querySelector("[data-remover]").addEventListener("click", () => {
      item.remove();
    });
    lista.appendChild(fragmento);
    return item;
  }

  btnAddExperiencia.addEventListener("click", () => {
    const item = criarItemRepetivel(templateExperiencia, listaExperiencias);
    item.querySelector("input").focus();
  });

  btnAddCurso.addEventListener("click", () => {
    const item = criarItemRepetivel(templateCurso, listaCursos);
    item.querySelector("input").focus();
  });

  // Começa cada etapa com pelo menos um item, para não confundir o usuário
  function garantirItemInicial() {
    if (!listaExperiencias.children.length) criarItemRepetivel(templateExperiencia, listaExperiencias);
    if (!listaCursos.children.length) { /* cursos é opcional — começa vazio */ }
  }
  garantirItemInicial();

  // =========================================================
  // Máscara automática do telefone: (00) 00000-0000
  // =========================================================

  function mascararTelefone(valor) {
    const digitos = (valor || "").replace(/\D/g, "").slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }

  const campoTelefone = el("telefone");
  campoTelefone.addEventListener("input", (evento) => {
    const posicaoAntes = evento.target.selectionStart;
    const tamanhoAntes = evento.target.value.length;
    evento.target.value = mascararTelefone(evento.target.value);
    // Mantém o cursor numa posição razoável depois de reformatar o texto.
    const diferenca = evento.target.value.length - tamanhoAntes;
    const novaPosicao = Math.max(0, (posicaoAntes || 0) + diferenca);
    evento.target.setSelectionRange(novaPosicao, novaPosicao);
  });

  // =========================================================
  // Tamanho do texto (acessibilidade): botões A- / A+
  // =========================================================

  const NIVEIS_FONTE = ["fonte-pequena", "", "fonte-grande", "fonte-extra-grande"];
  const CHAVE_FONTE = "curriculo-facil-tamanho-fonte";
  let indiceFonte = 1; // "" = tamanho padrão

  function aplicarTamanhoFonte() {
    NIVEIS_FONTE.forEach((classe) => classe && document.documentElement.classList.remove(classe));
    const classeAtual = NIVEIS_FONTE[indiceFonte];
    if (classeAtual) document.documentElement.classList.add(classeAtual);
    try {
      localStorage.setItem(CHAVE_FONTE, String(indiceFonte));
    } catch (e) {
      /* navegador sem localStorage disponível — segue sem lembrar a preferência */
    }
    btnFonteMenos.disabled = indiceFonte === 0;
    btnFonteMais.disabled = indiceFonte === NIVEIS_FONTE.length - 1;
  }

  (function iniciarTamanhoFonte() {
    try {
      const salvo = localStorage.getItem(CHAVE_FONTE);
      if (salvo !== null) {
        const n = parseInt(salvo, 10);
        if (!Number.isNaN(n) && n >= 0 && n < NIVEIS_FONTE.length) indiceFonte = n;
      }
    } catch (e) {
      /* segue com o tamanho padrão */
    }
    aplicarTamanhoFonte();
  })();

  btnFonteMais.addEventListener("click", () => {
    indiceFonte = Math.min(indiceFonte + 1, NIVEIS_FONTE.length - 1);
    aplicarTamanhoFonte();
    anunciar("Texto maior");
  });

  btnFonteMenos.addEventListener("click", () => {
    indiceFonte = Math.max(indiceFonte - 1, 0);
    aplicarTamanhoFonte();
    anunciar("Texto menor");
  });

  // =========================================================
  // Coleta e preenchimento dos dados do formulário
  // =========================================================

  function coletarDados() {
    const experiencias = Array.from(listaExperiencias.querySelectorAll("[data-item-experiencia]")).map((item) => ({
      cargo: item.querySelector('[data-campo="cargo"]').value.trim(),
      empresa: item.querySelector('[data-campo="empresa"]').value.trim(),
      inicio: item.querySelector('[data-campo="inicio"]').value.trim(),
      fim: item.querySelector('[data-campo="fim"]').value.trim(),
      descricao: item.querySelector('[data-campo="descricao"]').value.trim()
    }));

    const cursos = Array.from(listaCursos.querySelectorAll("[data-item-curso]")).map((item) => ({
      nomeCurso: item.querySelector('[data-campo="nomeCurso"]').value.trim(),
      instituicaoCurso: item.querySelector('[data-campo="instituicaoCurso"]').value.trim()
    }));

    return {
      nome: el("nome").value.trim(),
      cidade: el("cidade").value.trim(),
      telefone: el("telefone").value.trim(),
      email: el("email").value.trim(),
      objetivo: el("objetivo").value.trim(),
      experiencias,
      escolaridade: el("escolaridade").value,
      instituicao: el("instituicao").value.trim(),
      cursos,
      habilidades: el("habilidades").value.trim(),
      disponibilidade: el("disponibilidade").value.trim(),
      cnh: el("cnh").checked,
      veiculo: el("veiculo").checked
    };
  }

  function preencherFormulario(dados) {
    el("nome").value = dados.nome || "";
    el("cidade").value = dados.cidade || "";
    el("telefone").value = dados.telefone || "";
    el("email").value = dados.email || "";
    el("objetivo").value = dados.objetivo || "";
    el("escolaridade").value = dados.escolaridade || "";
    el("instituicao").value = dados.instituicao || "";
    el("habilidades").value = dados.habilidades || "";
    el("disponibilidade").value = dados.disponibilidade || "";
    el("cnh").checked = !!dados.cnh;
    el("veiculo").checked = !!dados.veiculo;

    listaExperiencias.innerHTML = "";
    (dados.experiencias || []).forEach((exp) => {
      const item = criarItemRepetivel(templateExperiencia, listaExperiencias);
      item.querySelector('[data-campo="cargo"]').value = exp.cargo || "";
      item.querySelector('[data-campo="empresa"]').value = exp.empresa || "";
      item.querySelector('[data-campo="inicio"]').value = exp.inicio || "";
      item.querySelector('[data-campo="fim"]').value = exp.fim || "";
      item.querySelector('[data-campo="descricao"]').value = exp.descricao || "";
    });
    if (!listaExperiencias.children.length) criarItemRepetivel(templateExperiencia, listaExperiencias);

    listaCursos.innerHTML = "";
    (dados.cursos || []).forEach((curso) => {
      const item = criarItemRepetivel(templateCurso, listaCursos);
      item.querySelector('[data-campo="nomeCurso"]').value = curso.nomeCurso || "";
      item.querySelector('[data-campo="instituicaoCurso"]').value = curso.instituicaoCurso || "";
    });
  }

  function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto || "";
    return div.innerHTML;
  }

  // Itens usados só como incentivo/orientação — nenhum deles bloqueia o
  // download do PDF, que continua exigindo apenas nome, cidade e telefone.
  const ITENS_COMPLETUDE = [
    { rotulo: "Nome preenchido", checar: (d) => !!d.nome },
    { rotulo: "Cidade preenchida", checar: (d) => !!d.cidade },
    { rotulo: "Telefone preenchido", checar: (d) => !!d.telefone },
    { rotulo: "Objetivo profissional", checar: (d) => !!d.objetivo },
    { rotulo: "Pelo menos uma experiência (ou bico)", checar: (d) => d.experiencias.some((e) => e.cargo) },
    { rotulo: "Escolaridade selecionada", checar: (d) => !!d.escolaridade },
    { rotulo: "Alguma habilidade listada", checar: (d) => !!d.habilidades }
  ];

  function renderizarCompletude(d) {
    const atendidos = ITENS_COMPLETUDE.filter((item) => item.checar(d));
    const percentual = Math.round((atendidos.length / ITENS_COMPLETUDE.length) * 100);
    const faltando = ITENS_COMPLETUDE.filter((item) => !item.checar(d));

    let mensagem;
    if (percentual === 100) {
      mensagem = "Seu currículo está completo! 🎉";
    } else if (percentual >= 70) {
      mensagem = "Quase lá! Faltam só alguns detalhes.";
    } else {
      mensagem = "Você já pode baixar, mas completar mais alguns campos ajuda a conseguir a vaga.";
    }

    completudeCurriculo.innerHTML = `
      <p class="completude-texto"><strong>${percentual}% completo</strong> — ${escapeHtml(mensagem)}</p>
      <div class="completude-barra" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentual}" aria-label="Completude do currículo">
        <div class="completude-preenchida" style="width:${percentual}%"></div>
      </div>
      ${faltando.length ? `<p class="completude-dica">Para melhorar: ${faltando.map((i) => escapeHtml(i.rotulo)).join(", ")}.</p>` : ""}
    `;
  }

  function renderizarPreview() {
    const d = coletarDados();
    renderizarCompletude(d);
    let html = `<h3>${escapeHtml(d.nome) || "Seu nome"}</h3>`;
    const contato = [d.cidade, d.telefone, d.email].filter(Boolean).map(escapeHtml).join(" &nbsp;|&nbsp; ");
    if (contato) html += `<p>${contato}</p>`;

    if (d.objetivo) {
      html += `<div class="preview-secao"><h4>Objetivo</h4><p>${escapeHtml(d.objetivo)}</p></div>`;
    }

    const experiencias = d.experiencias.filter((e) => e.cargo);
    if (experiencias.length) {
      html += `<div class="preview-secao"><h4>Experiência</h4>`;
      experiencias.forEach((exp) => {
        const periodo = [exp.inicio, exp.fim].filter(Boolean).join(" — ");
        html += `<p><strong>${escapeHtml(exp.cargo)}</strong>${periodo ? " (" + escapeHtml(periodo) + ")" : ""}<br>${escapeHtml(exp.empresa)}${exp.descricao ? "<br>" + escapeHtml(exp.descricao) : ""}</p>`;
      });
      html += `</div>`;
    }

    if (d.escolaridade) {
      html += `<div class="preview-secao"><h4>Escolaridade</h4><p>${escapeHtml(d.escolaridade)}${d.instituicao ? " — " + escapeHtml(d.instituicao) : ""}</p></div>`;
    }

    const cursos = d.cursos.filter((c) => c.nomeCurso);
    if (cursos.length) {
      html += `<div class="preview-secao"><h4>Cursos</h4><p>${cursos.map((c) => escapeHtml(c.nomeCurso) + (c.instituicaoCurso ? " — " + escapeHtml(c.instituicaoCurso) : "")).join("<br>")}</p></div>`;
    }

    if (d.habilidades) {
      html += `<div class="preview-secao"><h4>Habilidades</h4><p>${escapeHtml(d.habilidades)}</p></div>`;
    }

    const extras = [];
    if (d.disponibilidade) extras.push("Disponibilidade: " + d.disponibilidade);
    if (d.cnh) extras.push("Possui CNH");
    if (d.veiculo) extras.push("Possui veículo próprio");
    if (extras.length) {
      html += `<div class="preview-secao"><h4>Outras informações</h4><p>${extras.map(escapeHtml).join(" • ")}</p></div>`;
    }

    previewCurriculo.innerHTML = html;
  }

  // =========================================================
  // Gerar PDF
  // =========================================================

  btnGerarPdf.addEventListener("click", () => {
    const dados = coletarDados();
    if (!dados.nome || !dados.cidade || !dados.telefone) {
      statusAcao.textContent = "Preencha ao menos nome, cidade e telefone (etapa 1) antes de baixar.";
      return;
    }
    try {
      const arquivo = window.gerarPdfCurriculo(dados);
      statusAcao.textContent = `Pronto! "${arquivo}" foi baixado. Você já pode enviar pelo WhatsApp ou imprimir.`;
    } catch (erro) {
      console.error(erro);
      statusAcao.textContent = "Ocorreu um erro ao gerar o PDF. Tente novamente.";
    }
  });

  btnCompartilharWhatsapp.addEventListener("click", async () => {
    const dados = coletarDados();
    if (!dados.nome || !dados.cidade || !dados.telefone) {
      statusAcao.textContent = "Preencha ao menos nome, cidade e telefone (etapa 1) antes de compartilhar.";
      return;
    }
    try {
      const resultado = await window.compartilharPdfCurriculo(dados);
      if (resultado.compartilhado) {
        statusAcao.textContent = "Currículo enviado! Confira o app que você escolheu (ex: WhatsApp).";
      } else if (resultado.cancelado) {
        statusAcao.textContent = "Compartilhamento cancelado.";
      } else {
        statusAcao.textContent = `Seu navegador não permite compartilhar arquivos direto, então "${resultado.nomeArquivo}" foi baixado — é só anexar no WhatsApp manualmente.`;
      }
    } catch (erro) {
      console.error(erro);
      statusAcao.textContent = "Não foi possível compartilhar o PDF. Tente baixar e enviar manualmente.";
    }
  });

  // =========================================================
  // Login com Google + salvar/carregar currículos
  // =========================================================

  function atualizarInterfaceLogin(usuario) {
    if (usuario) {
      btnLogin.hidden = true;
      userInfo.hidden = false;
      userAvatar.src = usuario.photoURL || "";
      userAvatar.alt = "";
      userName.textContent = usuario.displayName || usuario.email || "Minha conta";
      btnSalvarNuvem.hidden = false;
      carregarListaDeCurriculos();
    } else {
      btnLogin.hidden = false;
      userInfo.hidden = true;
      btnSalvarNuvem.hidden = true;
      areaMeusCurriculos.hidden = true;
    }
  }

  function formatarData(timestamp) {
    if (!timestamp || typeof timestamp.toDate !== "function") return "";
    const d = timestamp.toDate();
    const data = d.toLocaleDateString("pt-BR");
    const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `Salvo em ${data} às ${hora}`;
  }

  async function carregarListaDeCurriculos() {
    areaMeusCurriculos.hidden = false;
    listaCurriculosSalvos.innerHTML = "";
    try {
      const curriculos = await window.CurriculoAuth.listarCurriculos();

      if (!curriculos.length) {
        const vazio = document.createElement("li");
        vazio.className = "lista-vazia";
        vazio.textContent = "Você ainda não salvou nenhum currículo. Quando salvar um, ele aparece aqui.";
        listaCurriculosSalvos.appendChild(vazio);
        return;
      }

      curriculos.forEach((c) => {
        const li = document.createElement("li");

        const info = document.createElement("div");
        info.className = "info-curriculo";
        const nomeSpan = document.createElement("span");
        nomeSpan.className = "nome-curriculo";
        nomeSpan.textContent = c.nome || "Currículo sem nome";
        info.appendChild(nomeSpan);
        const dataTexto = formatarData(c.atualizadoEm);
        if (dataTexto) {
          const dataSpan = document.createElement("span");
          dataSpan.className = "data-curriculo";
          dataSpan.textContent = dataTexto;
          info.appendChild(dataSpan);
        }

        const acoes = document.createElement("div");
        acoes.className = "acoes-curriculo";

        const btnAbrir = document.createElement("button");
        btnAbrir.type = "button";
        btnAbrir.className = "btn btn-secundario";
        btnAbrir.textContent = "Abrir";
        btnAbrir.addEventListener("click", async () => {
          const dados = await window.CurriculoAuth.carregarCurriculo(c.id);
          if (dados) {
            idCurriculoAtual = c.id;
            preencherFormulario(dados);
            iniciarFormulario();
          }
        });

        const btnExcluir = document.createElement("button");
        btnExcluir.type = "button";
        btnExcluir.className = "btn btn-remover";
        btnExcluir.textContent = "Excluir";
        btnExcluir.addEventListener("click", async () => {
          if (confirm("Excluir este currículo salvo? Essa ação não pode ser desfeita.")) {
            await window.CurriculoAuth.excluirCurriculo(c.id);
            if (idCurriculoAtual === c.id) idCurriculoAtual = null;
            carregarListaDeCurriculos();
          }
        });

        acoes.appendChild(btnAbrir);
        acoes.appendChild(btnExcluir);
        li.appendChild(info);
        li.appendChild(acoes);
        listaCurriculosSalvos.appendChild(li);
      });
    } catch (erro) {
      console.error("Erro ao listar currículos:", erro);
      const erroLi = document.createElement("li");
      erroLi.className = "lista-vazia";
      erroLi.textContent = "Não foi possível carregar seus currículos agora. Tente novamente em instantes.";
      listaCurriculosSalvos.appendChild(erroLi);
    }
  }

  btnLogin.addEventListener("click", async () => {
    try {
      await window.CurriculoAuth.login();
    } catch (erro) {
      console.error(erro);
      if (window.CurriculoAuth.disponivel) {
        statusAcao.textContent = "Não foi possível entrar com Google. Tente novamente.";
      }
    }
  });

  btnLogout.addEventListener("click", async () => {
    await window.CurriculoAuth.logout();
    idCurriculoAtual = null;
  });

  btnMeusCurriculos.addEventListener("click", irParaMeusCurriculos);

  btnSalvarNuvem.addEventListener("click", async () => {
    const dados = coletarDados();
    if (!dados.nome) {
      statusAcao.textContent = "Preencha ao menos o nome antes de salvar.";
      return;
    }
    try {
      idCurriculoAtual = await window.CurriculoAuth.salvarCurriculo(dados, idCurriculoAtual);
      statusAcao.textContent = "Currículo salvo na sua conta Google! Você pode continuar editando quando quiser.";
    } catch (erro) {
      console.error(erro);
      statusAcao.textContent = "Não foi possível salvar. Verifique se você está logado.";
    }
  });

  window.addEventListener("curriculo-auth-pronto", () => {
    if (window.CurriculoAuth.disponivel) {
      window.addEventListener("curriculo-auth-mudou", (evento) => {
        atualizarInterfaceLogin(evento.detail);
      });
    } else {
      // Firebase não configurado: mantém a experiência sem login
      btnLogin.title = "Login com Google ainda não foi configurado neste site.";
    }
  });
})();
