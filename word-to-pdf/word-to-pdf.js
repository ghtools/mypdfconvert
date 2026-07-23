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
  if(!f) return;
  const name = f.name.toLowerCase();
  if(!name.endsWith('.docx')) return;
  file = f;
  fileList.innerHTML = `<div class="file-item"><span class="fname">${f.name}</span><span class="remove" id="rm">✕</span></div>`;
  document.getElementById('rm').addEventListener('click', () => { file = null; fileList.innerHTML=''; runBtn.disabled = true; });
  runBtn.disabled = false;
}

async function extractParagraphs(file){
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const docXmlFile = zip.file('word/document.xml');
  if(!docXmlFile) throw new Error('This does not look like a valid .docx file.');
  const xmlStr = await docXmlFile.async('string');
  const xml = new DOMParser().parseFromString(xmlStr, 'application/xml');
  const paragraphNodes = xml.getElementsByTagName('w:p');
  const paragraphs = [];
  for(const p of paragraphNodes){
    const textNodes = p.getElementsByTagName('w:t');
    let text = '';
    for(const t of textNodes) text += t.textContent;
    paragraphs.push(text);
  }
  return paragraphs;
}

function wrapText(text, font, size, maxWidth){
  if(!text) return [''];
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for(const word of words){
    const candidate = current ? current + ' ' + word : word;
    if(font.widthOfTextAtSize(candidate, size) > maxWidth && current){
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if(current) lines.push(current);
  return lines.length ? lines : [''];
}

async function buildPdf(paragraphs){
  const { PDFDocument, StandardFonts } = PDFLib;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 11;
  const lineHeight = 15;
  const margin = 50;
  const pageWidth = 612;
  const pageHeight = 792;
  const maxWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function newPage(){
    page = doc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }

  for(const para of paragraphs){
    const lines = wrapText(para, font, fontSize, maxWidth);
    for(const line of lines){
      if(y < margin){
        newPage();
      }
      page.drawText(line, { x: margin, y, size: fontSize, font });
      y -= lineHeight;
    }
    y -= lineHeight * 0.4;
    if(y < margin) newPage();
  }

  return await doc.save();
}

runBtn.addEventListener('click', async () => {
  status.className = 'status';
  status.textContent = 'Reading document…';
  runBtn.disabled = true;
  try{
    const paragraphs = await extractParagraphs(file);
    status.textContent = 'Building PDF…';
    const pdfBytes = await buildPdf(paragraphs);
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    downloadLink.href = URL.createObjectURL(blob);
    result.classList.add('show');
    status.textContent = '';
  }catch(err){
    status.className = 'status err';
    status.textContent = 'Error: ' + err.message;
  }
  runBtn.disabled = false;
});
