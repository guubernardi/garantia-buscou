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



// ---- DOWNLOAD DA TELA COMO IMAGEM ----
function downloadScreenshot() {
  const container = document.querySelector('.container');
  
  setTimeout(() => {
    html2canvas(container).then(canvas => {
      const link = document.createElement('a');
      link.download = 'print.png';
      link.href = canvas.toDataURL();
      link.click();
    });
  }, 300); // espera curta pra garantir que imagens estejam no DOM
  button.classList.add('pulsando');
  // ... depois do print:
  button.classList.remove('pulsando');
}