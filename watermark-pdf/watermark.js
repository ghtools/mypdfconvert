const dz = document.getElementById('dz');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const options = document.getElementById('options');
const textInput = document.getElementById('textInput');
const positionSel = document.getElementById('position');
const colorSel = document.getElementById('color');
const opacitySel = document.getElementById('opacity');
const fontSizeSel = document.getElementById('fontSize');
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
textInput.addEventListener('input', updateRunState);

function updateRunState(){
  runBtn.disabled = !(file && textInput.value.trim());
}

function handleFile(f){
  if(!f || (!f.type.includes('pdf') && !f.name.toLowerCase().endsWith('.pdf'))) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; options.style.display='none'; updateRunState(); });
  options.style.display = 'flex';
  updateRunState();
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Adding watermark…';
  runBtn.disabled = true;
  try{
    const { PDFDocument, rgb, degrees, StandardFonts } = PDFLib;
    const bytes = await file.arrayBuffer();
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);
    const text = textInput.value.trim();
    const opacity = parseFloat(opacitySel.value);
    const fontSize = parseInt(fontSizeSel.value);
    const position = positionSel.value;

    const colorMap = {
      gray: rgb(0.5, 0.5, 0.5),
      red: rgb(0.8, 0.1, 0.1),
      blue: rgb(0.1, 0.3, 0.8),
      black: rgb(0.1, 0.1, 0.1),
    };
    const color = colorMap[colorSel.value] || colorMap.gray;
    const rotateDeg = position.includes('diagonal') ? 45 : 0;
    const margin = 24;

    doc.getPages().forEach(page => {
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(text, fontSize);
      let x, y;

      switch(position){
        case 'top-left':
          x = margin;
          y = height - margin - fontSize;
          break;
        case 'top-right':
          x = width - margin - textWidth;
          y = height - margin - fontSize;
          break;
        case 'bottom-left':
          x = margin;
          y = margin;
          break;
        case 'bottom-right':
          x = width - margin - textWidth;
          y = margin;
          break;
        case 'center':
          x = width / 2 - textWidth / 2;
          y = height / 2;
          break;
        case 'center-diagonal':
        default:
          x = width / 2 - textWidth / 2;
          y = height / 2;
          break;
      }

      page.drawText(text, {
        x, y,
        size: fontSize,
        font,
        color,
        opacity,
        rotate: degrees(rotateDeg),
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
