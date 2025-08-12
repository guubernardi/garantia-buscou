// ---- ELEMENTOS PRINCIPAIS ----
const mainTitle = document.getElementById('mainTitle');
const textarea = document.getElementById('titleInput');
const updateBtn = document.getElementById('updateBtn');

// ---- CONVERSÕES ENTRE HTML E TEXTO ----
function htmlToText(html) {
  return html.replace(/<br\s*\/?>/gi, '\n').replace(/\s+\n/g, '\n').trim();
}

function textToHtml(text) {
  return text.replace(/\n/g, '<br>');
}

// ---- ATUALIZAR TÍTULO ----
function updateTitle() {
  if (updateBtn.disabled) return;
  mainTitle.innerHTML = textToHtml(textarea.value.trim());

  mainTitle.classList.remove('title-updated');
  void mainTitle.offsetWidth;
  mainTitle.classList.add('title-updated');

  updateBtn.disabled = true;
}

// ---- ATALHO: CTRL + ENTER ----
document.addEventListener('keydown', (e) => {
  const isConfirm = (e.ctrlKey || e.metaKey) && e.key === 'Enter';
  if (isConfirm) updateTitle();
});

// ---- INICIALIZAÇÃO DO TEXTAREA E BOTÃO ----
textarea.value = htmlToText(mainTitle.innerHTML);
updateBtn.disabled = true;

textarea.addEventListener('input', () => {
  updateBtn.disabled = textarea.value.trim() === '';
});


// ---- UPLOAD DE IMAGENS NOS CARDS ----
const input = document.getElementById('ImageInput');
const cards = document.querySelectorAll('.card');
const previewMsg = document.getElementById('preview-msg'); // 👈 adiciona isso

input.addEventListener('change', function () {
  const files = input.files;
  if (!files || files.length === 0) {
    previewMsg.textContent = 'Nenhuma imagem selecionada.';
    return;
  }

  previewMsg.textContent = `${files.length} imagem(ns) carregada(s).`;

  [...files].forEach((file, index) => {
    if (index < cards.length) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.borderRadius = '15px';
        img.style.objectFit = 'contain';
        img.style.zIndex = '1';

        const card = cards[index];
        card.innerHTML = ''; // limpa conteúdo anterior
        card.appendChild(img);
      };
      reader.readAsDataURL(file);
    }
  });
});



/**
 * @file screenshot.js
 * @description Contém a lógica para capturar a tela inteira da página web e forçar o download como uma imagem PNG.
 * @author Seu Nome (ou da equipe)
 * @date 2025-08-12
 */

// ---- DOWNLOAD DA TELA COMO IMAGEM ----

/**
 * Tira um "print" do body inteiro da página usando a biblioteca html2canvas,
 * cria uma imagem a partir dele e inicia o download no navegador do usuário.
 */
function downloadScreenshot() {

  // O alvo da captura é a página inteira, então o melhor elemento para isso é o <body>.
  const targetElement = document.body;

  // --- PREPARAÇÃO PARA A CAPTURA ---

  // 1. Salvar a posição atual do scroll do usuário.
  // A gente vai resetar o scroll pra tirar o print, então precisamos guardar isso
  // para devolver a página ao estado original depois, sem atrapalhar a navegação.
  const originalScrollX = window.scrollX;
  const originalScrollY = window.scrollY;

  // 2. Levar a página para o topo.
  // Macete essencial! O html2canvas renderiza a partir da viewport. Se não fizermos
  // isso, a captura pode começar do meio da página e cortar o conteúdo. Também garante
  // que elementos com `position: fixed` sejam posicionados corretamente.
  window.scrollTo(0, 0);

  // 3. Um pequeno delay.
  // O `scrollTo` não é 100% síncrono. O navegador precisa de um tempinho para
  // renderizar a mudança. Esse timeout garante que a captura só aconteça DEPOIS
  // que a página já rolou para o topo. 100ms é um valor seguro.
  setTimeout(() => {

    // --- EXECUÇÃO DO HTML2CANVAS ---
    html2canvas(targetElement, {
      // Opções para garantir uma captura de qualidade e completa.

      // Aumenta a resolução da imagem final. `scale: 2` é como um "retina display".
      scale: 2,

      // Necessário para que imagens de outros domínios (Ex: de um CDN) sejam renderizadas.
      // Se `false`, essas imagens não aparecerão no print.
      useCORS: true,

      // Define o tamanho da imagem gerada para ser o tamanho total do conteúdo da página,
      // incluindo a parte que está fora da tela (o scroll). É isso que captura "tudo".
      width: targetElement.scrollWidth,
      height: targetElement.scrollHeight,

      // Informa ao html2canvas o tamanho da "janela" e a posição do scroll.
      // Como forçamos o scroll para (0,0), passamos esses valores. Crucial para
      // que elementos fixos e outros cálculos de layout funcionem bem.
      windowWidth: document.documentElement.clientWidth,
      windowHeight: document.documentElement.clientHeight,
      scrollX: 0,
      scrollY: 0

    }).then(canvas => {
      // --- MANIPULAÇÃO DO RESULTADO ---
      
      // O html2canvas retorna um elemento <canvas>. Agora, vamos convertê-lo em um arquivo.

      // 1. Cria um elemento de link <a> temporário em memória.
      const link = document.createElement('a');

      // 2. Define o nome do arquivo que será baixado.
      link.download = 'captura-de-tela.png';

      // 3. Converte o canvas para uma URL de dados (formato base64) e a define como o `href` do link.
      link.href = canvas.toDataURL('image/png');

      // 4. Simula um clique no link para iniciar o download. É um truque padrão no frontend.
      link.click();

    }).finally(() => {
      // --- LIMPEZA PÓS-CAPTURA ---

      // A parte mais importante para a experiência do usuário:
      // Devolve o scroll para a posição original. Assim, a captura ocorre
      // de forma "invisível", sem que o usuário perca onde estava na página.
      window.scrollTo(originalScrollX, originalScrollY);
    });
  }, 100);
}