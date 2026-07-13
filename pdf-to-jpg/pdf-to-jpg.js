pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const progWrap = document.getElementById('progWrap');
const progBar = document.getElementById('progBar');
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
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; runBtn.disabled = true; });
  runBtn.disabled = false;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Rendering pages…';
  progWrap.classList.add('show');
  runBtn.disabled = true;
  try{
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const zip = new JSZip();
    const numPages = pdf.numPages;
    for(let i=1;i<=numPages;i++){
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.92));
      zip.file(`page-${i}.jpg`, blob);
      progBar.style.width = `${Math.round((i/numPages)*100)}%`;
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    downloadLink.href = URL.createObjectURL(zipBlob);
    result.classList.add('show');
    status.textContent = '';
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Error: ' + err.message;
  }
  runBtn.disabled = false;
});
