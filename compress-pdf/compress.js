pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const level = document.getElementById('level');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const progWrap = document.getElementById('progWrap');
const progBar = document.getElementById('progBar');
const result = document.getElementById('result');
const resultText = document.getElementById('resultText');
const downloadLink = document.getElementById('downloadLink');

let file = null;
let originalSize = 0;

dz.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  originalSize = f.size;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name} (${(f.size/1024/1024).toFixed(2)} MB)</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; runBtn.disabled = true; });
  options.style.display = 'flex';
  runBtn.disabled = false;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Compressing… this can take a moment for large files';
  progWrap.classList.add('show');
  runBtn.disabled = true;
  try{
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const { PDFDocument } = PDFLib;
    const outDoc = await PDFDocument.create();
    const quality = parseFloat(level.value);
    const numPages = pdf.numPages;

    for(let i=1;i<=numPages;i++){
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const jpgDataUrl = canvas.toDataURL('image/jpeg', quality);
      const jpgBytes = await (await fetch(jpgDataUrl)).arrayBuffer();
      const img = await outDoc.embedJpg(jpgBytes);
      const newPage = outDoc.addPage([viewport.width, viewport.height]);
      newPage.drawImage(img, { x:0, y:0, width: viewport.width, height: viewport.height });
      progBar.style.width = `${Math.round((i/numPages)*100)}%`;
    }

    const outBytes = await outDoc.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const newSize = blob.size;
    const savedPct = Math.max(0, Math.round((1 - newSize/originalSize) * 100));
    downloadLink.href = URL.createObjectURL(blob);
    resultText.textContent = `✅ Done — ${(newSize/1024/1024).toFixed(2)} MB (${savedPct}% smaller)`;
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
