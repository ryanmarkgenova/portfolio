(function(){
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* blurred motion background */
  const c = document.getElementById('blur'), x = c.getContext('2d');
  let w,h,t=0;
  const blobs=[{c:'#D83995',r:.34,sx:.62,sy:.55,a:.9},{c:'#FCFFFF',r:.22,sx:.75,sy:.35,a:.55},{c:'#035E80',r:.4,sx:.2,sy:.8,a:.8},{c:'#F08A3C',r:.16,sx:.6,sy:.7,a:.5}];
  function size(){const r=c.getBoundingClientRect();w=c.width=Math.round(r.width/2);h=c.height=Math.round(r.height/2)}
  function draw(){
    x.fillStyle='#0593C6';x.fillRect(0,0,w,h);
    x.filter='blur('+Math.round(w*.06)+'px)';
    blobs.forEach((b,i)=>{
      const px=w*(b.sx+Math.sin(t*.0006+i*1.7)*.08), py=h*(b.sy+Math.cos(t*.0005+i)*.1), rad=Math.min(w,h)*b.r*2;
      x.globalAlpha=b.a;x.fillStyle=b.c;x.beginPath();x.ellipse(px,py,rad*.45,rad,0,0,Math.PI*2);x.fill();
    });
    x.globalAlpha=1;x.filter='none';
  }
  size();draw();addEventListener('resize',()=>{size();draw()});
  if(!reduce){(function loop(n){t=n;draw();requestAnimationFrame(loop)})(0)}

  /* timecode */
  const tc=document.getElementById('timecode'), start=performance.now();
  const pad=n=>String(n).padStart(2,'0');
  setInterval(()=>{const s=(performance.now()-start)/1000;tc.textContent='REC '+pad(Math.floor(s/3600))+':'+pad(Math.floor(s/60)%60)+':'+pad(Math.floor(s)%60)+':'+pad(Math.floor(s*24)%24)},42);

  /* swinging slate */
  const slate=document.getElementById('slate'), strap=document.getElementById('strap');
  let ang=reduce?0:18, vel=0, drag=false, moved=false, lastX=0;
  function apply(){slate.style.transform='rotate('+ang+'deg)';strap.style.transform='rotate('+ang*.92+'deg)'}
  function tick(){
    if(!drag){vel+=-ang*.012;vel*=.975;ang+=vel}
    apply();if(!reduce)requestAnimationFrame(tick);
  }
  apply();if(!reduce)tick();
  slate.addEventListener('pointerdown',e=>{drag=true;moved=false;lastX=e.clientX;slate.setPointerCapture(e.pointerId)});
  slate.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-lastX;if(Math.abs(dx)>2)moved=true;lastX=e.clientX;ang=Math.max(-55,Math.min(55,ang+dx*.35));vel=dx*.35;if(reduce)apply()});
  function flip(){slate.classList.add('snap');setTimeout(()=>slate.classList.remove('snap'),140);setTimeout(()=>slate.classList.toggle('flipped'),120);vel+=4}
  slate.addEventListener('pointerup',()=>{drag=false;if(!moved)flip()});
  slate.addEventListener('pointercancel',()=>{drag=false});
  slate.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}if(e.key==='ArrowLeft'){vel-=3}if(e.key==='ArrowRight'){vel+=3}});

  /* filter */
  const btns=[...document.querySelectorAll('.switch button')], cards=[...document.querySelectorAll('.card')];
  btns.forEach(b=>b.addEventListener('click',()=>{
    const f=b.dataset.f;btns.forEach(o=>o.setAttribute('aria-pressed',o===b));
    cards.forEach(cd=>{const k=cd.dataset.k;cd.hidden=!(f==='all'||k===f||(k==='both'&&f!=='both'?true:k===f))});
  }));
})();
