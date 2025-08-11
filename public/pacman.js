// A compact, single-file Pac-Man-like game for demo purposes.
// Grid-based, dots, walls, simple ghosts.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE = 20; // pixels
const COLUMNS = 21;
const ROWS = 21;
const W = TILE * COLUMNS;
const H = TILE * ROWS;
canvas.width = W; canvas.height = H;

const status = document.getElementById('status');

// A simple map: 0 = empty, 1 = wall, 2 = dot
// We'll create a border + a few inner walls to make a maze-ish layout.
let map = [];
for (let r=0;r<ROWS;r++){
  map[r]=[];
  for (let c=0;c<COLUMNS;c++){
    if (r===0||r===ROWS-1||c===0||c===COLUMNS-1) map[r][c]=1;
    else map[r][c]=2; // dot
  }
}

// carve some walls (simple symmetric pattern)
const wallCoords = [
  [2,2],[2,3],[2,4],[4,2],[4,3],[4,4],
  [2,16],[2,15],[2,14],[4,16],[4,15],[4,14],
  [16,2],[16,3],[16,4],[14,2],[14,3],[14,4],
  [16,16],[16,15],[16,14],[14,16],[14,15],[14,14],
  [10,2],[10,3],[10,4],[10,16],[10,15],[10,14],
  [6,10],[7,10],[8,10],[12,10],[13,10],[14,10]
];
wallCoords.forEach(([r,c])=>{ map[r][c]=1; });

// clear center for Pac-Man start
for (let r=9;r<=11;r++)for(let c=9;c<=11;c++)map[r][c]=0;

let dotsLeft = 0;
for (let r=0;r<ROWS;r++)for(let c=0;c<COLUMNS;c++) if (map[r][c]===2) dotsLeft++;

const pac = {r:10,c:9,dirX:0,dirY:0, mouth:0,score:0};

const ghosts = [
  {r:10,c:11,dirX:1,dirY:0,color:'#ff6666'},
  {r:9,c:11,dirX:0,dirY:-1,color:'#66ff66'},
];

let gameOver = false;
let win = false;

function draw(){
  ctx.clearRect(0,0,W,H);
  // draw map
  for (let r=0;r<ROWS;r++){
    for (let c=0;c<COLUMNS;c++){
      const x=c*TILE;const y=r*TILE;
      if (map[r][c]===1){
        ctx.fillStyle='#222';
        ctx.fillRect(x,y,TILE,TILE);
      } else if (map[r][c]===2){
        // dot
        ctx.fillStyle='#ffd700';
        ctx.beginPath();
        ctx.arc(x+TILE/2,y+TILE/2,3,0,Math.PI*2);
        ctx.fill();
      }
    }
  }
  // draw pac
  const px = pac.c*TILE+TILE/2;
  const py = pac.r*TILE+TILE/2;
  ctx.fillStyle='#ffd53a';
  const mouthAngle = 0.25*Math.PI*Math.abs(Math.sin(pac.mouth));
  ctx.beginPath();
  ctx.moveTo(px,py);
  ctx.arc(px,py,TILE/2-2, mouthAngle, Math.PI*2-mouthAngle);
  ctx.closePath();
  ctx.fill();

  // draw ghosts
  ghosts.forEach(g=>{
    const gx=g.c*TILE+TILE/2; const gy=g.r*TILE+TILE/2;
    ctx.fillStyle=g.color;
    ctx.beginPath();
    ctx.arc(gx,gy,TILE/2-2,Math.PI,0);
    ctx.fill();
    // body
    ctx.fillRect(gx-TILE/2+2,gy,TILE-4,TILE/2-2);
    // eyes
    ctx.fillStyle='#fff'; ctx.fillRect(gx-6,gy-4,6,6); ctx.fillRect(gx+2,gy-4,6,6);
    ctx.fillStyle='#000'; ctx.fillRect(gx-4,gy-2,2,2); ctx.fillRect(gx+4,gy-2,2,2);
  });

  // HUD
  ctx.fillStyle='#fff'; ctx.font='14px monospace';
  ctx.fillText(`Score: ${pac.score}  Dots left: ${dotsLeft}`, 8, H-8);
}

function canMove(r,c){
  if (r<0||r>=ROWS||c<0||c>=COLUMNS) return false;
  return map[r][c]!==1;
}

function step(){
  if (gameOver||win) return;
  // pac movement: try intended direction
  if (pac.dirX!==0 || pac.dirY!==0){
    const nr = pac.r + pac.dirY;
    const nc = pac.c + pac.dirX;
    if (canMove(nr,nc)){
      pac.r=nr; pac.c=nc;
    }
  }
  // eat dot
  if (map[pac.r][pac.c]===2){ map[pac.r][pac.c]=0; pac.score+=10; dotsLeft--; }
  // simple ghost AI: random turns but avoid walls
  ghosts.forEach(g=>{
    if (Math.random()<0.2){
      // choose random dir that is valid
      const choices = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d=>canMove(g.r+d.y,g.c+d.x));
      if (choices.length) {
        const pick = choices[Math.floor(Math.random()*choices.length)];
        g.dirX = pick.x; g.dirY = pick.y;
      }
    }
    // move
    if (canMove(g.r+g.dirY, g.c+g.dirX)){
      g.r += g.dirY; g.c += g.dirX;
    } else {
      // pick a new dir
      const choices = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}].filter(d=>canMove(g.r+d.y,g.c+d.x));
      if (choices.length){ const pick = choices[Math.floor(Math.random()*choices.length)]; g.dirX=pick.x; g.dirY=pick.y; g.r+=g.dirY; g.c+=g.dirX; }
    }
  });

  // collisions
  ghosts.forEach(g=>{
    if (g.r===pac.r && g.c===pac.c){ gameOver=true; }
  });

  if (dotsLeft<=0){ win=true; }

  pac.mouth += 0.3;
}

// input
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowUp'){ pac.dirX=0; pac.dirY=-1; }
  if (e.key==='ArrowDown'){ pac.dirX=0; pac.dirY=1; }
  if (e.key==='ArrowLeft'){ pac.dirX=-1; pac.dirY=0; }
  if (e.key==='ArrowRight'){ pac.dirX=1; pac.dirY=0; }
  if (e.key==='r' && (gameOver||win)) location.reload();
});

// game loop
function loop(){
  step(); draw();
  if (gameOver) status.textContent = 'Game Over — press R to restart';
  else if (win) status.textContent = 'You Win! 🎉 — press R to play again';
  else status.textContent = 'Playing...';
}

setInterval(loop, 140);

// initial draw
draw();

