const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const mode = document.getElementById('mode');
const rangeFields = document.getElementById('rangeFields');
const startPage = document.getElementById('startPage');
const endPage = document.getElementById('endPage');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const progWrap = document.getElementById('progWrap');
const progBar = document.getElementById('progBar');
const result = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');

let file = null;
let pageCount = 0;

dz.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => handleFile(e.dataTransfer.files[0]));
fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
mode.addEventListener('change', () => {
  rangeFields.style.display = mode.value === 'range' ? 'block' : 'none';
});

async function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; runBtn.disabled = true; });
  const { PDFDocument } = PDFLib;
  const bytes = await f.arrayBuffer();
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  pageCount = doc.getPageCount();
  status.textContent = `${pageCount} pages detected.`;
  options.style.display = 'flex';
  runBtn.disabled = false;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  runBtn.disabled = true;
  progWrap.classList.add('show');
  try{
    const { PDFDocument } = PDFLib;
    const bytes = await file.arrayBuffer();
    const srcDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    if(mode.value === 'all'){
      status.textContent = 'Splitting pages…';
      const zip = new JSZip();
      for(let i=0;i<pageCount;i++){
        const newDoc = await PDFDocument.create();
        const [page] = await newDoc.copyPages(srcDoc, [i]);
        newDoc.addPage(page);
        const outBytes = await newDoc.save();
        zip.file(`page-${i+1}.pdf`, outBytes);
        progBar.style.width = `${Math.round(((i+1)/pageCount)*100)}%`;
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadLink.href = URL.createObjectURL(zipBlob);
      downloadLink.download = 'split-pages.zip';
      downloadLink.textContent = 'Download ZIP';
    } else {
      const start = Math.max(1, parseInt(startPage.value) || 1);
      const end = Math.min(pageCount, parseInt(endPage.value) || pageCount);
      if(start > end) throw new Error('Start page must be before end page.');
      const newDoc = await PDFDocument.create();
      const indices = [];
      for(let i=start-1;i<end;i++) indices.push(i);
      const pages = await newDoc.copyPages(srcDoc, indices);
      pages.forEach(p => newDoc.addPage(p));
      const outBytes = await newDoc.save();
      const blob = new Blob([outBytes], { type: 'application/pdf' });
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = `pages-${start}-${end}.pdf`;
      downloadLink.textContent = 'Download PDF';
      progBar.style.width = '100%';
    }
    status.textContent = '';
    result.classList.add('show');
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Error: ' + err.message;
  }
  runBtn.disabled = false;
});
