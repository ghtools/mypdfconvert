const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const positionSel = document.getElementById('position');
const formatSel = document.getElementById('format');
const startNumInput = document.getElementById('startNum');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');

let file = null;

dz.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; runBtn.disabled = true; });
  options.style.display = 'flex';
  runBtn.disabled = false;
}

function formatLabel(format, current, total){
  if(format === 'pageof') return `Page ${current} of ${total}`;
  if(format === 'dash') return `- ${current} -`;
  return `${current}`;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Adding page numbers…';
  runBtn.disabled = true;
  try{
    const { PDFDocument, StandardFonts, rgb } = PDFLib;
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pages = doc.getPages();
    const total = pages.length;
    const start = parseInt(startNumInput.value) || 1;
    const format = formatSel.value;
    const position = positionSel.value;
    const fontSize = 11;
    const margin = 28;

    pages.forEach((page, idx) => {
      const current = start + idx;
      const label = formatLabel(format, current, total);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(label, fontSize);
      let x, y;

      if(position.includes('center')) x = width / 2 - textWidth / 2;
      else if(position.includes('left')) x = margin;
      else x = width - margin - textWidth;

      if(position.includes('top')) y = height - margin;
      else y = margin - 4;

      page.drawText(label, {
        x, y,
        size: fontSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    });

    const outBytes = await doc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    downloadLink.href = URL.createObjectURL(blob);
    result.classList.add('show');
    status.textContent = '';
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Error: ' + err.message;
  }
  runBtn.disabled = false;
});

window.addEventListener('pageshow', (e) => {
  if(e.persisted){
    result.classList.remove('show');
    fileList.innerHTML = '';
    fileInput.value = '';
    file = null;
    options.style.display = 'none';
    runBtn.disabled = true;
    status.textContent = '';
  }
});
