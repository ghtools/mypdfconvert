const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const topInput = document.getElementById('topMargin');
const bottomInput = document.getElementById('bottomMargin');
const leftInput = document.getElementById('leftMargin');
const rightInput = document.getElementById('rightMargin');
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

function pct(input){
  const v = parseFloat(input.value);
  if(isNaN(v) || v < 0) return 0;
  if(v > 45) return 45;
  return v;
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Cropping…';
  runBtn.disabled = true;
  try{
    const { PDFDocument } = PDFLib;
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });

    const topPct = pct(topInput) / 100;
    const bottomPct = pct(bottomInput) / 100;
    const leftPct = pct(leftInput) / 100;
    const rightPct = pct(rightInput) / 100;

    doc.getPages().forEach(page => {
      const { width, height } = page.getSize();
      const left = width * leftPct;
      const right = width * rightPct;
      const top = height * topPct;
      const bottom = height * bottomPct;
      const newWidth = Math.max(10, width - left - right);
      const newHeight = Math.max(10, height - top - bottom);
      page.setCropBox(left, bottom, newWidth, newHeight);
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
