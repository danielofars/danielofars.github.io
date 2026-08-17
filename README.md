# Currículo Fácil

Site leve e acessível para gerar currículos em PDF pelo celular, feito para trabalhadores informais e pessoas com pouco acesso a computador. Sem framework, sem build step — apenas HTML, CSS e JavaScript puro, mais duas bibliotecas via CDN (jsPDF e, opcionalmente, Firebase).

## Como funciona

- Formulário guiado em 7 etapas curtas, com dicas em linguagem simples em cada campo (inclusive orientação de como descrever bicos e trabalho autônomo).
- O PDF é montado inteiramente no navegador do usuário (jsPDF) — nenhum dado passa por um servidor nesse processo.
- Login com Google (opcional) permite salvar e recarregar currículos depois, usando Firebase Auth + Firestore.
- Sem login, nada é armazenado: ao fechar a aba, os dados digitados somem, exatamente como prometido na tela inicial (LGPD by design).
- Dois espaços reservados para Google AdSense (topo e rodapé).

## Estrutura de arquivos

```
curriculo-facil/
├── index.html          Página única com todas as etapas do formulário
├── css/style.css        Estilos mobile-first e acessíveis
├── js/
│   ├── app.js            Lógica do wizard, validação, prévia
│   ├── pdf-generator.js  Montagem do PDF (jsPDF)
│   ├── auth.js           Login Google + Firestore (opcional)
│   └── firebase-config.js  Credenciais do seu projeto Firebase
├── firestore.rules      Regras de segurança (cada usuário só vê os próprios dados)
├── ads.txt               Placeholder para o Google AdSense
└── DEPLOY.md             Passo a passo de configuração e publicação
```

## Rodando localmente para testar

Como é só HTML/CSS/JS estático, basta servir a pasta com qualquer servidor simples (não pode abrir o `index.html` direto com `file://` porque os módulos JS exigem `http://`):

```bash
cd curriculo-facil
python3 -m http.server 8080
# depois abra http://localhost:8080 no navegador
```

Sem preencher `js/firebase-config.js`, o site funciona 100% (gera PDF normalmente); só o login fica desativado com um aviso.

## Próximos passos para colocar no ar

Veja o `DEPLOY.md` para o passo a passo completo: criar o projeto Firebase, publicar no GitHub Pages (grátis, HTTPS automático), e ativar o Google AdSense.

## Acessibilidade

- Compatível com leitores de tela: `label` em todo campo, `fieldset`/`legend` por etapa, região `aria-live` anunciando mudança de etapa, foco visível, texto alternativo em imagens.
- Alvos de toque grandes (mínimo 44px), fonte que respeita o zoom do navegador, funciona sem mouse (só teclado).
- Layout mobile-first: pensado primeiro para telas pequenas de celular.

## Privacidade e LGPD

- **Sem login:** nenhum dado do currículo sai do navegador do usuário. O PDF é gerado localmente.
- **Com login:** os dados ficam em `usuarios/{uid}/curriculos/` no Firestore, protegidos por regras que impedem qualquer pessoa de acessar dados de outro usuário (veja `firestore.rules`). O usuário pode excluir cada currículo salvo a qualquer momento pela própria interface.
