const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const runBtn = document.getElementById('runBtn');
const status = document.getElementById('status');
const progWrap = document.getElementById('progWrap');
const progBar = document.getElementById('progBar');
const result = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');

let files = [];

dz.addEventListener('click', () => fileInput.click());
['dragover','dragenter'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag'); }));
['dragleave','drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag'); }));
dz.addEventListener('drop', e => addFiles(e.dataTransfer.files));
fileInput.addEventListener('change', e => addFiles(e.target.files));

function addFiles(list){
  for(const f of list){
    if(f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')){
      files.push(f);
    }
  }
  renderList();
}

function renderList(){
  fileList.innerHTML = '';
  files.forEach((f, i) => {
    const row = document.createElement('div');
    row.className = 'file-item dragrow';
    row.draggable = true;
    row.dataset.index = i;
    row.innerHTML = `<span class="fname">${i+1}. ${f.name}</span><span class="remove" data-i="${i}">✕</span>`;
    fileList.appendChild(row);
  });
  fileList.querySelectorAll('.remove').forEach(el => {
    el.addEventListener('click', () => {
      files.splice(parseInt(el.dataset.i), 1);
      renderList();
    });
  });
  enableDrag();
  runBtn.disabled = files.length < 2;
  status.textContent = files.length === 1 ? 'Add at least one more PDF to merge.' : '';
}

function enableDrag(){
  let dragSrc = null;
  fileList.querySelectorAll('.dragrow').forEach(row => {
    row.addEventListener('dragstart', () => { dragSrc = row; });
    row.addEventListener('dragover', e => e.preventDefault());
    row.addEventListener('drop', () => {
      const from = parseInt(dragSrc.dataset.index);
      const to = parseInt(row.dataset.index);
      const moved = files.splice(from, 1)[0];
      files.splice(to, 0, moved);
      renderList();
    });
  });
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Merging…';
  progWrap.classList.add('show');
  runBtn.disabled = true;
  try{
    const { PDFDocument } = PDFLib;
    const mergedPdf = await PDFDocument.create();
    for(let i=0;i<files.length;i++){
      const bytes = await files[i].arrayBuffer();
      const src = await PDFDocument.load(bytes, { ignoreEncryption: true });
      const pages = await mergedPdf.copyPages(src, src.getPageIndices());
      pages.forEach(p => mergedPdf.addPage(p));
      progBar.style.width = `${Math.round(((i+1)/files.length)*100)}%`;
    }
    const outBytes = await mergedPdf.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    downloadLink.href = URL.createObjectURL(blob);
    result.classList.add('show');
    status.textContent = '';
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Something went wrong: ' + err.message;
  }
  runBtn.disabled = false;
});
