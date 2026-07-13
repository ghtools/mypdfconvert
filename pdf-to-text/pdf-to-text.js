pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
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
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; runBtn.disabled = true; });
  runBtn.disabled = false;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Extracting text…';
  runBtn.disabled = true;
  try{
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for(let i=1;i<=pdf.numPages;i++){
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map(it => it.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    const blob = new Blob([fullText], { type: 'text/plain' });
    downloadLink.href = URL.createObjectURL(blob);
    result.classList.add('show');
    status.textContent = '';
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Error: ' + err.message;
  }
  runBtn.disabled = false;
});
