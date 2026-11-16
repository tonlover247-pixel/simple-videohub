let currentFilm = null;
let isPlaying = false;
let currentTime = 0;
let duration = 10;
let notes = [];
let animationId = null;
let filmWindow = null;

const filmSelect = document.getElementById('film-select');
const filmFrame = document.getElementById('film-frame');
const overlay = document.getElementById('overlay');
const ctx = overlay.getContext('2d');
const scrubber = document.getElementById('scrubber');
const timeDisplay = document.getElementById('time-display');
const notesList = document.getElementById('notes-list');

async function loadFilms() {
  const res = await fetch('/api/films');
  const films = await res.json();
  filmSelect.innerHTML = films.map(f => `<option value="${f}">${f}</option>`).join('');
  if (films.length) loadFilm(films[0]);
}

async function loadFilm(name) {
  currentFilm = name;
  filmFrame.src = `/films/${name}/film.html`;
  notes = [];
  currentTime = 0;
  renderNotes();
  setTimeout(() => {
    filmWindow = filmFrame.contentWindow;
    if (filmWindow && filmWindow.duration) duration = filmWindow.duration;
    scrubber.max = duration;
  }, 800);
}

function updateFrame(t) {
  if (!filmWindow || !filmWindow.renderOut) return;
  filmWindow.renderOut(t);
  currentTime = t;
  scrubber.value = t;
  timeDisplay.textContent = t.toFixed(2) + 's';
  drawOverlay();
}

function play() {
  if (isPlaying) return;
  isPlaying = true;
  document.getElementById('play-pause').textContent = 'Pause';
  let last = performance.now();
  function loop(now) {
    if (!isPlaying) return;
    const dt = (now - last) / 1000;
    last = now;
    currentTime = Math.min(currentTime + dt, duration);
    updateFrame(currentTime);
    if (currentTime >= duration) isPlaying = false;
    animationId = requestAnimationFrame(loop);
  }
  animationId = requestAnimationFrame(loop);
}

function pause() {
  isPlaying = false;
  document.getElementById('play-pause').textContent = 'Play';
  cancelAnimationFrame(animationId);
}

function drawOverlay() {
  overlay.width = filmFrame.clientWidth;
  overlay.height = filmFrame.clientHeight;
  overlay.style.width = filmFrame.clientWidth + 'px';
  overlay.style.height = filmFrame.clientHeight + 'px';
  ctx.clearRect(0, 0, overlay.width, overlay.height);
  notes.filter(n => Math.abs(n.time - currentTime) < 0.15).forEach(n => {
    const x = n.x * overlay.width;
    const y = n.y * overlay.height;
    ctx.strokeStyle = '#ff6b00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.stroke();
  });
}

filmFrame.addEventListener('load', () => {
  filmWindow = filmFrame.contentWindow;
});

document.getElementById('play-pause').onclick = () => isPlaying ? pause() : play();
document.getElementById('step-back').onclick = () => { pause(); updateFrame(Math.max(0, currentTime - 1/30)); };
document.getElementById('step-fwd').onclick = () => { pause(); updateFrame(Math.min(duration, currentTime + 1/30)); };
scrubber.oninput = () => { pause(); updateFrame(parseFloat(scrubber.value)); };

document.getElementById('preview-container').onclick = (e) => {
  if (!currentFilm) return;
  const rect = filmFrame.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const text = prompt('Note for this frame:') || 'Fix this';
  notes.push({ time: currentTime, x, y, text });
  renderNotes();
  drawOverlay();
};

document.getElementById('add-note').onclick = () => {
  const text = prompt('Note at ' + currentTime.toFixed(2) + 's:') || 'Check this';
  notes.push({ time: currentTime, x: 0.5, y: 0.5, text });
  renderNotes();
};

document.getElementById('copy-notes').onclick = () => {
  if (!notes.length) return alert('No notes yet');
  const msg = `Video notes on "${currentFilm}":\n` + notes.map(n => 
    `- ${n.time.toFixed(1)}s — circle at (${(n.x*100).toFixed(0)}%, ${(n.y*100).toFixed(0)}%) — "${n.text}"`
  ).join('\n');
  navigator.clipboard.writeText(msg);
  alert('Notes copied! Paste into Claude Code.');
};

function renderNotes() {
  notesList.innerHTML = notes.map((n, i) => `
    <div class="note">
      <small>${n.time.toFixed(2)}s</small><br>
      ${n.text}
      <button onclick="notes.splice(${i},1); renderNotes(); drawOverlay();" style="float:right; background:#444; padding:2px 6px;">✕</button>
    </div>
  `).join('');
}

document.getElementById('load-btn').onclick = () => loadFilm(filmSelect.value);
filmSelect.onchange = () => loadFilm(filmSelect.value);

loadFilms();
