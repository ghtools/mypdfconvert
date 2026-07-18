const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const pagesInput = document.getElementById('pagesInput');
const pageCountMsg = document.getElementById('pageCountMsg');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const result = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');

let file = null;
let pageCount = 0;

dz.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
pagesInput.addEventListener('input', () => { runBtn.disabled = !pagesInput.value.trim(); });

function parsePageOrder(str, maxPage){
  const indices = [];
  const parts = str.split(',').map(p => p.trim()).filter(Boolean);
  for(const part of parts){
    if(part.includes('-')){
      const [a, b] = part.split('-').map(n => parseInt(n.trim()));
      if(isNaN(a) || isNaN(b)) continue;
      const start = Math.max(1, Math.min(a, b));
      const end = Math.min(maxPage, Math.max(a, b));
      for(let i = start; i <= end; i++) indices.push(i - 1);
    } else {
      const n = parseInt(part);
      if(!isNaN(n) && n >= 1 && n <= maxPage) indices.push(n - 1);
    }
  }
  return indices;
}

async function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; runBtn.disabled = true; });
  const { PDFDocument } = PDFLib;
  const bytes = await f.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  pageCount = doc.getPageCount();
  pageCountMsg.textContent = `This PDF has ${pageCount} pages.`;
  options.style.display = 'flex';
  runBtn.disabled = true;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  runBtn.disabled = true;
  try{
    const keepIndices = parsePageOrder(pagesInput.value, pageCount);
    if(keepIndices.length === 0){
      throw new Error('Enter valid page numbers, e.g. 1, 3, 5-7');
    }
    const { PDFDocument } = PDFLib;
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(srcDoc, keepIndices);
    pages.forEach(p => newDoc.addPage(p));
    const outBytes = await newDoc.save();
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
