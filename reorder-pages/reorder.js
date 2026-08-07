const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const orderInput = document.getElementById('orderInput');
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
orderInput.addEventListener('input', () => { runBtn.disabled = !orderInput.value.trim(); });

async function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; runBtn.disabled = true; });
  const { PDFDocument } = PDFLib;
  const bytes = await f.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  pageCount = doc.getPageCount();
  pageCountMsg.textContent = `This PDF has ${pageCount} pages. Example order: ${Array.from({length: pageCount}, (_, i) => pageCount - i).join(',')}`;
  orderInput.value = Array.from({length: pageCount}, (_, i) => i + 1).join(',');
  options.style.display = 'flex';
  runBtn.disabled = false;
}

function parseOrder(str, count){
  const parts = str.split(',').map(p => parseInt(p.trim())).filter(n => !isNaN(n));
  if(parts.length !== count) return null;
  const seen = new Set(parts);
  if(seen.size !== count) return null;
  for(const n of parts){
    if(n < 1 || n > count) return null;
  }
  return parts.map(n => n - 1);
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  runBtn.disabled = true;
  try{
    const order = parseOrder(orderInput.value, pageCount);
    if(!order){
      throw new Error(`Enter all ${pageCount} page numbers exactly once, separated by commas.`);
    }
    const { PDFDocument } = PDFLib;
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const newDoc = await PDFDocument.create();
    const pages = await newDoc.copyPages(srcDoc, order);
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

window.addEventListener('pageshow', (e) => {
  if(e.persisted){
    result.classList.remove('show');
    fileList.innerHTML = '';
    fileInput.value = '';
    file = null;
    options.style.display = 'none';
    orderInput.value = '';
    runBtn.disabled = true;
    status.textContent = '';
  }
});
