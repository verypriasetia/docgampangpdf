(function(){
'use strict';
const $=id=>document.getElementById(id);
const status=$('status'),run=$('run'),fileInput=$('file'),drop=$('drop');
let file=null;
const {jsPDF}=window.jspdf||{};
if(!window.pdfjsLib||!jsPDF||!window.html2canvas||!window.docx||!window.JSZip){status.textContent='Library belum termuat. Refresh halaman atau periksa koneksi internet.';return;}
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const outputs=[['noise','noiseOut','%'],['warp','warpOut',' mm'],['sigSize','sigSizeOut','%'],['sigX','sigXOut','%'],['sigY','sigYOut','%'],['stkSize','stkSizeOut','%'],['stkX','stkXOut','%'],['stkY','stkYOut','%']];
outputs.forEach(([a,b,s])=>$(a).addEventListener('input',()=>$(b).textContent=$(a).value+s));
function setFile(f){if(!f)return;if(!/\.(pdf|docx)$/i.test(f.name)){status.textContent='File harus PDF atau DOCX.';return;}file=f;$('name').textContent=f.name;run.disabled=false;$('download').hidden=true;status.textContent='File siap diproses: '+f.name;}
fileInput.addEventListener('change',e=>{if(e.target.files&&e.target.files[0])setFile(e.target.files[0]);});
['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();drop.classList.add('drag');}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();e.stopPropagation();drop.classList.remove('drag');}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files&&e.dataTransfer.files[0];if(f)setFile(f);});

function rng(seed){let x=(seed>>>0)||1;return()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
function pageSet(text,n){text=(text||'all').trim().toLowerCase();if(!text||text==='all')return true;return text.split(',').map(x=>parseInt(x.trim(),10)).includes(n);}
function readImage(f){return new Promise((res,rej)=>{const u=URL.createObjectURL(f),im=new Image();im.onload=()=>{URL.revokeObjectURL(u);res(im)};im.onerror=e=>{URL.revokeObjectURL(u);rej(e)};im.src=u;});}

// Object-only transform for images embedded in DOCX. Text nodes are untouched.
function randomSign(r){return r()<.5?-1:1;}
function mmToPx(mm, dpi){return mm*dpi/25.4;}
function classifyEmbeddedImage(img, pageEl){
  const rect=img.getBoundingClientRect();
  const pr=pageEl.getBoundingClientRect();
  const w=Math.max(1,rect.width),h=Math.max(1,rect.height),ratio=w/h;
  const y=(rect.top-pr.top)/Math.max(1,pr.height);
  // Heuristic: square-ish image near the lower part of a page => stamp;
  // wide/short image near lower part => signature.
  if(y<0.45)return 'other';
  if(ratio>=1.45)return 'signature';
  if(ratio>=0.65&&ratio<=1.45)return 'stamp';
  return 'other';
}
function applyEmbeddedObjectEffects(pageEl,dpi,r){
  if(!$('objectEffects').checked)return;
  const imgs=[...pageEl.querySelectorAll('img')];
  const pageRect=pageEl.getBoundingClientRect();
  const maxPx=mmToPx(3,dpi);
  imgs.forEach(img=>{
    if(!img.naturalWidth||!img.naturalHeight)return;
    const kind=classifyEmbeddedImage(img,pageEl);
    if(kind==='other')return;
    const dx=(r()*2-1)*maxPx,dy=(r()*2-1)*maxPx;
    if(kind==='stamp'){
      const deg=(r()*10-5);
      img.style.transformOrigin='50% 50%';
      img.style.transform=`translate(${dx}px,${dy}px) rotate(${deg}deg)`;
      img.style.willChange='transform';
    }else if(kind==='signature'){
      // Max 3 mm object displacement is converted to a small skew angle
      // relative to the image dimensions. The displacement itself stays <=3 mm.
      const rect=img.getBoundingClientRect();
      const iw=Math.max(10,rect.width),ih=Math.max(10,rect.height);
      const skewX=Math.atan(maxPx/iw)*180/Math.PI*randomSign(r)*r();
      const skewY=Math.atan(maxPx/ih)*180/Math.PI*randomSign(r)*r();
      const mode=r()<.5?'skew':'perspective';
      img.style.transformOrigin='50% 50%';
      img.style.transform=mode==='skew'
        ?`translate(${dx}px,${dy}px) skewX(${skewX}deg) skewY(${skewY}deg)`
        :`translate(${dx}px,${dy}px) perspective(900px) rotateX(${skewY*.55}deg) rotateY(${skewX*.55}deg)`;
      img.style.willChange='transform';
    }
  });
}

async function pdfPages(f,dpi){const data=await f.arrayBuffer(),pdf=await pdfjsLib.getDocument({data}).promise,pages=[];for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i),v=p.getViewport({scale:dpi/72}),c=document.createElement('canvas');c.width=Math.ceil(v.width);c.height=Math.ceil(v.height);await p.render({canvasContext:c.getContext('2d'),viewport:v}).promise;pages.push(c);}return pages;}

async function docxPages(f,dpi,r){
  const host=document.createElement('div');
  host.style.cssText='position:fixed;left:-100000px;top:0;width:794px;background:#fff;z-index:-1;color:#000';
  document.body.appendChild(host);
  await window.docx.renderAsync(await f.arrayBuffer(),host,null,{breakPages:true,ignoreWidth:false,ignoreHeight:false,ignoreLastRenderedPageBreak:false,useBase64URL:true});
  const pages=[...host.querySelectorAll('.docx-wrapper > section.docx')];
  const pageNodes=pages.length?pages:[...host.querySelectorAll('section.docx')];
  if(!pageNodes.length){host.remove();throw new Error('DOCX tidak dapat dirender menjadi 9 halaman.');}
  const canv=[];
  for(let i=0;i<pageNodes.length;i++){
    const n=pageNodes[i];
    n.style.background='#fff';n.style.backgroundColor='#fff';n.style.boxShadow='none';
    // Object transform happens on image elements only. Text remains in its original layout.
    applyEmbeddedObjectEffects(n,dpi,r);
    const raw=await html2canvas(n,{backgroundColor:'#fff',scale:1,useCORS:true,logging:false,removeContainer:true,imageTimeout:15000});
    const c=document.createElement('canvas');c.width=raw.width;c.height=raw.height;
    const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(raw,0,0);canv.push(c);
  }
  host.remove();return canv;
}

function distort(src,mm,dpi,r){if(mm<=0)return src;const w=src.width,h=src.height,px=mm*dpi/25.4,out=document.createElement('canvas');out.width=w;out.height=h;const ctx=out.getContext('2d');ctx.fillStyle='rgb(255,255,252)';ctx.fillRect(0,0,w,h);const strips=160;const L=[(r()*2-1)*px,(r()*2-1)*px],R=[(r()*2-1)*px,(r()*2-1)*px],BL=[(r()*2-1)*px,(r()*2-1)*px],BR=[(r()*2-1)*px,(r()*2-1)*px];for(let i=0;i<strips;i++){const t=i/(strips-1),y=i*h/strips,sh=h/strips+1,lx=L[0]*(1-t)+BL[0]*t,rx=R[0]*(1-t)+BR[0]*t;ctx.save();ctx.beginPath();ctx.rect(0,y,w,sh);ctx.clip();const sx=(w+rx-lx)/w;ctx.setTransform(sx,0,0,1,lx,0);ctx.drawImage(src,0,y,w,sh,0,y,w,sh);ctx.restore();}return out;}
function addNoise(c,amount,r){const ctx=c.getContext('2d'),n=Math.round(c.width*c.height/30000*(amount/25));for(let i=0;i<n;i++){const x=r()*c.width,y=r()*c.height,z=r()<.86?1:2,a=(5+r()*10)/255,g=100+r()*70;ctx.fillStyle=`rgba(${g},${g},${g},${a})`;ctx.beginPath();ctx.arc(x,y,z,0,Math.PI*2);ctx.fill();}}
function addUploadedOverlay(c,img,kind,pageNo,r,dpi){const ctx=c.getContext('2d');const pages=kind==='signature'?$('sigPages').value:$('stkPages').value;if(!pageSet(pages,pageNo))return;const size=+(kind==='signature'?$('sigSize').value:$('stkSize').value)/100;const x=+(kind==='signature'?$('sigX').value:$('stkX').value)/100;const y=+(kind==='signature'?$('sigY').value:$('stkY').value)/100;const w=c.width*size, h=w*(img.naturalHeight/img.naturalWidth),dx=(r()*2-1)*mmToPx(3,dpi),dy=(r()*2-1)*mmToPx(3,dpi);ctx.save();ctx.translate(c.width*x+dx,c.height*y+dy);if(kind==='sticker'){ctx.rotate((r()*10-5)*Math.PI/180);}else{const sx=Math.atan(mmToPx(3,dpi)/Math.max(10,w))*180/Math.PI*(r()<.5?-1:1)*r();const sy=Math.atan(mmToPx(3,dpi)/Math.max(10,h))*180/Math.PI*(r()<.5?-1:1)*r();ctx.transform(1,Math.tan(sy*Math.PI/180),Math.tan(sx*Math.PI/180),1,0,0);}ctx.globalAlpha=.96;ctx.drawImage(img,-w/2,-h/2,w,h);ctx.restore();}

run.addEventListener('click',async()=>{if(!file)return;run.disabled=true;$('download').hidden=true;try{const dpi=+$('dpi').value||96,noise=+$('noise').value,warp=+$('warp').value;let seed=+$('seed').value;if(!Number.isFinite(seed))seed=Math.floor(Math.random()*2147483647);const r=rng(seed);const sig=$('signature').files[0]?await readImage($('signature').files[0]):null;const stk=$('sticker').files[0]?await readImage($('sticker').files[0]):null;status.textContent='Membaca file…';let pages=/\.pdf$/i.test(file.name)?await pdfPages(file,dpi):await docxPages(file,dpi,r);let out=null;for(let i=0;i<pages.length;i++){status.textContent=`Memproses halaman ${i+1} dari ${pages.length}…`;let c=pages[i];if(sig)addUploadedOverlay(c,sig,'signature',i+1,r,dpi);if(stk)addUploadedOverlay(c,stk,'sticker',i+1,r,dpi);const d=distort(c,warp,dpi,r);addNoise(d,noise,r);const ori=d.width>=d.height?'landscape':'portrait';if(!out)out=new jsPDF({orientation:ori,unit:'px',format:[d.width,d.height],compress:true});else out.addPage([d.width,d.height],ori);out.addImage(d.toDataURL('image/jpeg',.96),'JPEG',0,0,d.width,d.height);}if(!out)throw new Error('Tidak ada halaman yang berhasil diproses.');const blob=out.output('blob'),url=URL.createObjectURL(blob),base=file.name.replace(/\.[^.]+$/,'');const a=$('download');a.href=url;a.download=base+'_FIN.pdf';a.textContent=`Download ${base}_FIN.pdf`;a.hidden=false;status.textContent=`Selesai. ${pages.length} halaman diproses.`;}catch(e){console.error(e);status.textContent='Gagal: '+(e&&e.message?e.message:e);}finally{run.disabled=false;}});
})();
