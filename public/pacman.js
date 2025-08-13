const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Base grid dimensions
const COLUMNS = 21;
const ROWS = 21;
let TILE;

function resizeCanvas(){
  const size = Math.min(window.innerWidth, 600);
  TILE = Math.floor(size / COLUMNS);
  canvas.width = TILE * COLUMNS;
  canvas.height = TILE * ROWS;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const W = canvas.width;
const H = canvas.height;

let map = [];
for (let r=0;r<ROWS;r++){
  map[r]=[];
  for (let c=0;c<COLUMNS;c++){
    if (r===0||r===ROWS-1||c===0||c===COLUMNS-1) map[r][c]=1;
    else map[r][c]=2;
  }
}
const wallCoords = [ [2,2],[2,3],[2,4],[4,2],[4,3],[4,4], [2,16],[2,15],[2,14],[4,16],[4,15],[4,14], [16,2],[16,3],[16,4],[14,2],[14,3],[14,4], [16,16],[16,15],[16,14],[14,16],[14,15],[14,14], [10,2],[10,3],[10,4],[10,16],[10,15],[10,14], [6,10],[7,10],[8,10],[12,10],[13,10],[14,10] ];
wallCoords.forEach(([r,c])=>{ map[r][c]=1; });
for (let r=9;r<=11;r++)for(let c=9;c<=11;c++)map[r][c]=0;

let dotsLeft = 0;
for (let r=0;r<ROWS;r++)for(let c=0;c<COLUMNS;c++) if (map[r][c]===2) dotsLeft++;

const pac = {r:10,c:9,dirX:0,dirY:0, mouth:0,score:0};
const ghosts = [ {r:10,c:11,dirX:1,dirY:0,color:'#ff6666'}, {r:9,c:11,dirX:0,dirY:-1,color:'#66ff66'} ];
let gameOver = false;
let win = false;

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLUMNS;c++){
      const x=c*TILE;const y=r*TILE;
      if (map[r][c]===1){
        ctx.fillStyle='#222';
        ctx.fillRect(x,y,TILE,TILE);
      } else if (map[r][c]===2){
        ctx.fillStyle='#ffd700';
        ctx.beginPath();
        ctx.arc(x+TILE/2,y+TILE/2,Math.max(2,TILE/10),0,Math.PI*2);
        ctx.fill();
      }
    }
  }
  const px = pac.c*TILE+TILE/2;
  const py = pac.r*TILE+TILE/2;
  ctx.fillStyle='#ffd53a';
  const mouthAngle = 0.25*Math.PI*Math.abs(Math.sin(pac.mouth));
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.arc(px,py,TILE/2-2, mouthAngle, Math.PI*2-mouthAngle);
  ctx.closePath();
  ctx.fill();

  ghosts.forEach(g=>{
    const gx=g.c*TILE+TILE/2; const gy=g.r*TILE+TILE/2;
    ctx.fillStyle=g.color;
    ctx.beginPath();
    ctx.arc(gx,gy,TILE/2-2,Math.PI,0);
    ctx.fill();
    ctx.fillRect(gx-TILE/2+2,gy,TILE-4,TILE/2-2);
    ctx.fillStyle='#fff'; ctx.fillRect(gx-TILE/4,gy-TILE/6,TILE/6,TILE/6); ctx.fillRect(gx+TILE/12,gy-TILE/6,TILE/6,TILE/6);
    ctx.fillStyle='#000'; ctx.fillRect(gx-TILE/6,gy-TILE/12,TILE/12,TILE/12); ctx.fillRect(gx+TILE/6,gy-TILE/12,TILE/12,TILE/12);
  });

  ctx.fillStyle='#fff'; ctx.font=`${Math.floor(TILE*0.7)}px monospace`;
  ctx.fillText(`Score: ${pac.score}`, 8, canvas.height-8);
}

function canMove(r,c){
  if (r<0||r>=ROWS||c<0||c>=COLUMNS) return false;
  return map[r][c]!==1;
}

function step(){
  if (gameOver||win) return;
  if (pac.dirX!==0 || pac.dirY!==0){
    const nr = pac.r + pac.dirY;
    const nc = pac.c + pac.dirX;
    if (canMove(nr,nc)){
      pac.r=nr; pac.c=nc;
    }
  }
  if (map[pac.r][pac.c]===2){ map[pac.r][pac.c]=0; pac.score+=10; dotsLeft--; }
  ghosts.forEach(g=>{
    if (Math.random()<0.2){
      const choices = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d=>canMove(g.r+d.y,g.c+d.x));
      if (choices.length) {
        const pick = choices[Math.floor(Math.random()*choices.length)];
        g.dirX = pick.x; g.dirY = pick.y;
      }
    }
    if (canMove(g.r+g.dirY, g.c+g.dirX)){
      g.r += g.dirY; g.c += g.dirX;
    } else {
      const choices = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d=>canMove(g.r+d.y,g.c+d.x));
      if (choices.length){ const pick = choices[Math.floor(Math.random()*choices.length)]; g.dirX=pick.x; g.dirY=pick.y; g.r+=g.dirY; g.c+=g.dirX; }
    }
  });
  ghosts.forEach(g=>{
    if (g.r===pac.r && g.c===pac.c){ gameOver=true; }
  });
  if (dotsLeft<=0){ win=true; }
  pac.mouth += 0.3;
}

// Keyboard input
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowUp'){ pac.dirX=0; pac.dirY=-1; }
  if (e.key==='ArrowDown'){ pac.dirX=0; pac.dirY=1; }
  if (e.key==='ArrowLeft'){ pac.dirX=-1; pac.dirY=0; }
  if (e.key==='ArrowRight'){ pac.dirX=1; pac.dirY=0; }
  if (e.key==='r' && (gameOver||win)) location.reload();
});

// Touch input for mobile
let touchStartX=0, touchStartY=0;
canvas.addEventListener('touchstart', e=>{
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});
canvas.addEventListener('touchend', e=>{
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) { pac.dirX=1; pac.dirY=0; }
    else { pac.dirX=-1; pac.dirY=0; }
  } else {
    if (dy > 0) { pac.dirX=0; pac.dirY=1; }
    else { pac.dirX=0; pac.dirY=-1; }
  }
});

function loop(){
  step(); draw();
  const status = document.getElementById('status');
  if (gameOver) status.textContent = 'Game Over — press R or tap to restart';
  else if (win) status.textContent = 'You Win! 🎉 — press R or tap to play again';
  else status.textContent = 'Playing...';
}

setInterval(loop, 140);
draw();
