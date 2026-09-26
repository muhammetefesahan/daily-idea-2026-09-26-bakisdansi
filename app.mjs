import { shiftEyes } from "./core.mjs";
const $ = id => document.getElementById(id);
const view = $("view"), ctx = view.getContext("2d", { willReadFrequently: true });
const raw = document.createElement("canvas"), rawCtx = raw.getContext("2d", { willReadFrequently: true });
const video = document.createElement("video"); video.autoplay = true; video.muted = true; video.playsInline = true;
const state = { stream: null, image: null, mode: null, points: [[.38,.43],[.62,.43]], next: 0, loop: 0, request: 0 };
const status = text => $("status").textContent = text;

function dimensions(w, h) {
  const max = 800, scale = Math.min(1, max / w, max / h);
  view.width = raw.width = Math.round(w * scale);
  view.height = raw.height = Math.round(h * scale);
  $("previewWrap").style.aspectRatio = `${view.width} / ${view.height}`;
}
function updateMarkers() {
  const marks = $("markers").children;
  state.points.forEach(([x,y],i) => { marks[i].style.left = 100*x+"%"; marks[i].style.top = 100*y+"%"; marks[i].style.width = ($("size").value*2)+"%"; });
  $("markers").style.display = state.mode ? "block" : "none";
}
function draw() {
  if (!state.mode) return;
  if (state.mode === "camera") {
    if (!video.videoWidth) { state.loop = requestAnimationFrame(draw); return; }
    rawCtx.save(); rawCtx.translate(raw.width,0); rawCtx.scale(-1,1);
    rawCtx.drawImage(video,0,0,raw.width,raw.height); rawCtx.restore();
  } else rawCtx.drawImage(state.image,0,0,raw.width,raw.height);
  const frame = rawCtx.getImageData(0,0,raw.width,raw.height);
  const pixels = shiftEyes(frame.data,raw.width,raw.height,state.points,Number($("size").value)/100,Number($("moveX").value)/100,Number($("moveY").value)/100);
  ctx.putImageData(new ImageData(pixels,raw.width,raw.height),0,0);
  if (state.mode === "camera") state.loop = requestAnimationFrame(draw);
}
function refresh() {
  ["moveX","moveY","size"].forEach((id)=> $(id==="moveX"?"xValue":id==="moveY"?"yValue":"sizeValue").textContent=$(id).value);
  updateMarkers(); if (state.mode !== "camera") draw();
}
function stopCamera() {
  state.request++;
  cancelAnimationFrame(state.loop);
  state.stream?.getTracks().forEach(t=>t.stop()); state.stream=null;
  video.srcObject=null; $("stopBtn").disabled=true;
}
async function startCamera() {
  stopCamera();
  const request = state.request;
  try {
    const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"user",width:{ideal:800}},audio:false});
    if (request !== state.request) { stream.getTracks().forEach(t=>t.stop()); return; }
    state.stream=stream; video.srcObject=stream; await video.play();
    dimensions(video.videoWidth,video.videoHeight); state.mode="camera"; state.image=null;
    $("empty").hidden=true; $("sourceBadge").textContent="Kamera açık • yerel";
    $("stopBtn").disabled=false; $("saveBtn").disabled=false; updateMarkers(); draw();
    status("Kameram açık. Göz halkalarını yerlerine koyabilirim.");
  } catch(e) { if (request !== state.request) return; stopCamera(); status("Kameram açılamadı: "+(e?.name==="NotAllowedError"?"İzin verilmedi.":"Tarayıcı veya cihaz kamerayı açamadı.")); }
}
function useImage(image,label) {
  stopCamera(); dimensions(image.width,image.height);
  state.image=image; state.mode="image"; $("empty").hidden=true; $("sourceBadge").textContent=label;
  $("saveBtn").disabled=false; updateMarkers(); draw(); status("Gözlerimi işaretleyip ayarları oynatabilirim.");
}
function demo() {
  const c=document.createElement("canvas"); c.width=800;c.height=600; const x=c.getContext("2d");
  const bg=x.createLinearGradient(0,0,800,600);bg.addColorStop(0,"#493c87");bg.addColorStop(1,"#30235d");x.fillStyle=bg;x.fillRect(0,0,800,600);
  x.fillStyle="#17112e";x.fillRect(0,450,800,150);
  x.fillStyle="#b7927d";x.beginPath();x.ellipse(400,342,213,245,0,0,Math.PI*2);x.fill();
  x.fillStyle="#21172e";x.beginPath();x.ellipse(400,165,210,100,0,0,Math.PI*2);x.fill();
  for(const cx of [305,495]){x.fillStyle="#fff4e6";x.beginPath();x.ellipse(cx,258,67,34,0,0,Math.PI*2);x.fill();x.fillStyle="#4f352a";x.beginPath();x.arc(cx-18,258,23,0,Math.PI*2);x.fill();x.fillStyle="#151321";x.beginPath();x.arc(cx-18,258,12,0,Math.PI*2);x.fill();x.fillStyle="#fff";x.beginPath();x.arc(cx-24,250,6,0,Math.PI*2);x.fill();x.strokeStyle="#48302b";x.lineWidth=7;x.beginPath();x.moveTo(cx-55,214);x.quadraticCurveTo(cx,197,cx+55,214);x.stroke();}
  x.strokeStyle="#75493f";x.lineWidth=9;x.beginPath();x.arc(400,386,57,.2,Math.PI-.2);x.stroke();
  state.points=[[305/800,258/600],[495/800,258/600]];state.next=0;
  useImage(c,"Çizilmiş örnek • gerçek kişi değil");status("Bu çizim bir örnek. Göz kaydırmayı burada deneyebilirim.");
}
$("cameraBtn").addEventListener("click",startCamera);
$("stopBtn").addEventListener("click",()=>{stopCamera();state.mode=null;$("empty").hidden=false;$("sourceBadge").textContent="Kamera kapalı";$("saveBtn").disabled=true;updateMarkers();status("Kameramı kapattım.");});
$("demoBtn").addEventListener("click",demo);
$("file").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{const bitmap=await createImageBitmap(file);state.points=[[.38,.43],[.62,.43]];useImage(bitmap,"Seçtiğim fotoğraf • yerel");}catch{status("Bu fotoğrafı açamadım.");}e.target.value="";});
$("previewWrap").addEventListener("click",e=>{if(!state.mode)return;const rect=view.getBoundingClientRect(); const x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;state.points[state.next]=[Math.max(.05,Math.min(.95,x)),Math.max(.05,Math.min(.95,y))];state.next=(state.next+1)%2;refresh();status(state.next?"Şimdi sağ gözümü işaretliyorum.":"İki gözü işaretledim. Kaydırıcıları deneyebilirim.");});
["moveX","moveY","size"].forEach(id=>$(id).addEventListener("input",refresh));
document.querySelectorAll("[data-preset]").forEach(b=>b.addEventListener("click",()=>{const p=b.dataset.preset;$("moveX").value=p==="silly"?35:p==="screen"?15:0;$("moveY").value=p==="silly"?-25:0;refresh();}));
$("saveBtn").addEventListener("click",()=>{if(!state.mode)return;draw();view.toBlob(blob=>{if(!blob){status("Fotoğrafı kaydedemedim.");return;}const a=document.createElement("a"),url=URL.createObjectURL(blob);a.href=url;a.download="bakisdansi.png";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status("Düzenlediğim fotoğrafı indirdim.");},"image/png");});
window.addEventListener("pagehide",stopCamera);
refresh();
