// =========================================================
// pdf-generator.js
// -----------------------------------------------------------
// Monta o PDF do currículo inteiramente no navegador (jsPDF).
// Nenhum dado é enviado a um servidor neste processo.
// =========================================================

(function () {
  const MARGEM = 18;
  const LARGURA_PAGINA = 210; // A4 em mm
  const LARGURA_UTIL = LARGURA_PAGINA - MARGEM * 2;
  const ALTURA_PAGINA = 297;

  function novaLinha(doc, y, altura) {
    if (y + altura > ALTURA_PAGINA - MARGEM) {
      doc.addPage();
      return MARGEM;
    }
    return y;
  }

  function escreverParagrafo(doc, texto, x, y, opts = {}) {
    const tamanhoFonte = opts.tamanho || 10.5;
    const largura = opts.largura || LARGURA_UTIL;
    doc.setFontSize(tamanhoFonte);
    doc.setFont("helvetica", opts.negrito ? "bold" : "normal");
    const linhas = doc.splitTextToSize(texto || "", largura);
    for (const linha of linhas) {
      y = novaLinha(doc, y, tamanhoFonte * 0.5);
      doc.text(linha, x, y);
      y += tamanhoFonte * 0.5;
    }
    return y;
  }

  function tituloSecao(doc, texto, y) {
    y = novaLinha(doc, y, 10) + 4;
    doc.setDrawColor(11, 93, 59);
    doc.setLineWidth(0.6);
    doc.line(MARGEM, y, LARGURA_PAGINA - MARGEM, y);
    y += 5;
    doc.setTextColor(11, 93, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11.5);
    doc.text(texto.toUpperCase(), MARGEM, y);
    doc.setTextColor(20, 20, 20);
    return y + 6;
  }

  // Monta o documento jsPDF a partir dos dados do formulário, sem salvar.
  // Reaproveitado tanto para baixar o arquivo quanto para compartilhar
  // (Web Share API), evitando duplicar a montagem do layout.
  function construirPdf(dados) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    let y = MARGEM;

    // Cabeçalho — nome
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(11, 93, 59);
    doc.text(dados.nome || "Nome não informado", MARGEM, y);
    y += 8;

    // Contato
    doc.setTextColor(60, 60, 60);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    const contato = [dados.cidade, dados.telefone, dados.email].filter(Boolean).join("   |   ");
    doc.text(contato, MARGEM, y);
    y += 8;
    doc.setTextColor(20, 20, 20);

    // Objetivo
    if (dados.objetivo) {
      y = tituloSecao(doc, "Objetivo", y);
      y = escreverParagrafo(doc, dados.objetivo, MARGEM, y);
      y += 4;
    }

    // Experiência
    const experiencias = (dados.experiencias || []).filter((e) => e.cargo);
    if (experiencias.length) {
      y = tituloSecao(doc, "Experiência Profissional", y);
      experiencias.forEach((exp, i) => {
        y = novaLinha(doc, y, 6);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.text(exp.cargo, MARGEM, y);
        const periodo = [exp.inicio, exp.fim].filter(Boolean).join(" — ");
        if (periodo) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(9.5);
          doc.text(periodo, LARGURA_PAGINA - MARGEM, y, { align: "right" });
        }
        y += 5;
        if (exp.empresa) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(10);
          y = escreverParagrafo(doc, exp.empresa, MARGEM, y, { tamanho: 10 });
        }
        if (exp.descricao) {
          y = escreverParagrafo(doc, exp.descricao, MARGEM, y);
        }
        if (i < experiencias.length - 1) y += 4;
      });
      y += 4;
    }

    // Escolaridade
    if (dados.escolaridade) {
      y = tituloSecao(doc, "Escolaridade", y);
      let texto = dados.escolaridade;
      if (dados.instituicao) texto += " — " + dados.instituicao;
      y = escreverParagrafo(doc, texto, MARGEM, y);
      y += 4;
    }

    // Cursos
    const cursos = (dados.cursos || []).filter((c) => c.nomeCurso);
    if (cursos.length) {
      y = tituloSecao(doc, "Cursos e Qualificações", y);
      cursos.forEach((curso) => {
        const texto = curso.instituicaoCurso
          ? `• ${curso.nomeCurso} — ${curso.instituicaoCurso}`
          : `• ${curso.nomeCurso}`;
        y = escreverParagrafo(doc, texto, MARGEM, y);
      });
      y += 4;
    }

    // Habilidades
    if (dados.habilidades) {
      y = tituloSecao(doc, "Habilidades", y);
      y = escreverParagrafo(doc, dados.habilidades, MARGEM, y);
      y += 4;
    }

    // Disponibilidade e extras
    const extras = [];
    if (dados.disponibilidade) extras.push("Disponibilidade: " + dados.disponibilidade);
    if (dados.cnh) extras.push("Possui CNH");
    if (dados.veiculo) extras.push("Possui veículo próprio");
    if (extras.length) {
      y = tituloSecao(doc, "Outras informações", y);
      y = escreverParagrafo(doc, extras.join("   •   "), MARGEM, y);
    }

    const nomeArquivo = (dados.nome ? dados.nome.trim().replace(/\s+/g, "_") : "curriculo") + ".pdf";
    return { doc, nomeArquivo };
  }

  window.gerarPdfCurriculo = function (dados) {
    const { doc, nomeArquivo } = construirPdf(dados);
    doc.save(nomeArquivo);
    return nomeArquivo;
  };

  // Tenta compartilhar o PDF diretamente (ex: WhatsApp) usando a Web Share
  // API com arquivos. Se o navegador não suportar (ex: computador sem
  // suporte, ou navegador mais antigo), cai automaticamente para o
  // download normal.
  window.compartilharPdfCurriculo = async function (dados) {
    const { doc, nomeArquivo } = construirPdf(dados);
    const blob = doc.output("blob");
    const arquivo = new File([blob], nomeArquivo, { type: "application/pdf" });

    const podeCompartilharArquivo =
      typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] });

    if (navigator.share && podeCompartilharArquivo) {
      try {
        await navigator.share({
          files: [arquivo],
          title: "Meu currículo",
          text: `Currículo de ${dados.nome || ""}`.trim()
        });
        return { compartilhado: true, nomeArquivo };
      } catch (erro) {
        // Usuário cancelou o compartilhamento — não trata como erro.
        if (erro && erro.name === "AbortError") {
          return { compartilhado: false, cancelado: true, nomeArquivo };
        }
        throw erro;
      }
    }

    // Sem suporte a compartilhar arquivo: baixa o PDF normalmente.
    doc.save(nomeArquivo);
    return { compartilhado: false, cancelado: false, nomeArquivo };
  };
})();
