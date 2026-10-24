import { AttentionSession, clamp, formatTime } from './engine.js';

const $ = id => document.getElementById(id);
const canvas = $('reflection'), ctx = canvas.getContext('2d');
const source = document.createElement('canvas'), sourceCtx = source.getContext('2d');
const video = $('camera');
let detector, stream, running = false, mode = '', session, lastTime = 0;
let lastDetection = 0, lastVideoTime = -1, face = null, baseline = null, calibration = [];
let ghosts = [], lastVisitFrame = null, report = null, lastSnapshot = 0;
let fadeStart = 6, closeRatio = 1.35;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function resize() {
  const rect = canvas.getBoundingClientRect();
  const w = Math.min(960, Math.round(rect.width * Math.min(devicePixelRatio, 1.5)));
  const h = Math.round(w * rect.height / rect.width);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = source.width = w; canvas.height = source.height = h;
  }
}
new ResizeObserver(resize).observe(canvas);

async function loadDetector() {
  if (detector) return detector;
  const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs');
  const vision = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm');
  detector = await FaceLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task' },
    runningMode: 'VIDEO', numFaces: 1,
    minFaceDetectionConfidence: 0.6, minFacePresenceConfidence: 0.6,
  });
  return detector;
}

function releaseCamera() {
  stream?.getTracks().forEach(track => track.stop()); stream = null;
  video.srcObject = null;
}

async function start(nextMode) {
  if (running) return;
  $('error').hidden = true; $('start').disabled = $('demo').disabled = true;
  $('start').textContent = 'Preparing the mirror…';
  try {
    if (nextMode === 'webcam') {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('Use localhost or HTTPS to enable webcam access. See the README for the local launch command.');
      await loadDetector();
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
      video.srcObject = stream; await video.play();
      stream.getVideoTracks()[0].addEventListener('ended', () => { if (running) { finish(); showError('The camera disconnected. Reconnect it and begin a new session.'); } });
    }
    mode = nextMode; session = new AttentionSession({ fadeStart });
    running = true; lastTime = performance.now(); lastDetection = 0; lastVideoTime = -1;
    baseline = null; calibration = []; face = null; ghosts = []; lastVisitFrame = null; lastSnapshot = 0;
    $('welcome').hidden = true; $('session-controls').hidden = false;
    $('demo-controls').hidden = mode !== 'demo'; $('calibrate').disabled = mode === 'demo';
    $('live-dot').classList.add('active'); $('session-indicator').textContent = mode === 'demo' ? 'SIMULATED' : 'LIVE';
    $('mode-label').textContent = mode === 'demo' ? 'ILLUSTRATED DEMO · NO CAMERA' : 'LIVE REFLECTION · LOCAL ONLY';
    $('demo-attention').checked = true; $('demo-close').checked = false;
  } catch (error) {
    releaseCamera();
    showError(error.name === 'NotAllowedError' ? 'Camera permission was denied. Allow camera access in your browser, then try again. You can also explore the demo.' : error.name === 'NotFoundError' ? 'No webcam was found. Connect one, or explore the illustrated demo.' : `Could not start the mirror. ${error.message} If model loading failed, check your internet connection or try the demo.`);
  } finally {
    $('start').disabled = $('demo').disabled = false;
    $('start').innerHTML = 'Begin experience <span>↗</span>';
  }
}
function showError(message) { $('error').textContent = message; $('error').hidden = false; }

function analyze(now) {
  if (now - lastDetection < 100 || video.currentTime === lastVideoTime || video.readyState < 2) return;
  lastDetection = now; lastVideoTime = video.currentTime;
  const landmarks = detector.detectForVideo(video, now).faceLandmarks[0];
  if (!landmarks) { face = null; return; }
  const left = landmarks[234], right = landmarks[454], nose = landmarks[1];
  const top = landmarks[10], chin = landmarks[152];
  const width = Math.abs(right.x - left.x), height = Math.abs(chin.y - top.y);
  const yaw = Math.abs((nose.x - (left.x + right.x) / 2) / Math.max(width, 0.01));
  const pitch = (nose.y - top.y) / Math.max(height, 0.01);
  face = { width, attentive: width > 0.06 && yaw < 0.19 && pitch > 0.25 && pitch < 0.78 };
  if (!baseline && face.attentive) {
    calibration.push(width);
    if (calibration.length >= 20) {
      calibration.sort((a, b) => a - b); baseline = calibration[Math.floor(calibration.length / 2)];
    }
  }
}

function drawDemo(now, close) {
  const w = source.width, h = source.height, c = sourceCtx;
  c.fillStyle = '#242d2d'; c.fillRect(0, 0, w, h);
  const scale = close ? 1.32 : 1;
  c.save(); c.translate(w / 2, h * 0.54); c.scale(scale, scale);
  const drift = reducedMotion ? 0 : Math.sin(now / 2000) * w * 0.009;
  c.translate(drift, 0);
  const glow = c.createRadialGradient(0, 0, 5, 0, 0, h * .5);
  glow.addColorStop(0, '#acc3b91d'); glow.addColorStop(1, '#acc3b900');
  c.fillStyle = glow; c.fillRect(-w, -h, w * 2, h * 2);
  c.strokeStyle = '#b8cec5'; c.lineWidth = 1.4;
  c.beginPath(); c.ellipse(0, -h * .06, w * .13, h * .23, 0, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(-w * .23, h * .4); c.bezierCurveTo(-w * .23, h * .18, -w * .09, h * .19, -w * .075, h * .16); c.moveTo(w * .23, h * .4); c.bezierCurveTo(w * .23, h * .18, w * .09, h * .19, w * .075, h * .16); c.stroke();
  c.strokeStyle = '#b8cec56b';
  for (const x of [-1, 1]) { c.beginPath(); c.ellipse(x * w * .047, -h * .09, w * .019, h * .008, 0, 0, Math.PI * 2); c.stroke(); }
  c.beginPath(); c.moveTo(0, -h * .08); c.lineTo(-w * .012, h * .01); c.lineTo(w * .013, h * .01); c.moveTo(-w * .035, h * .065); c.quadraticCurveTo(0, h * .08, w * .035, h * .065); c.stroke();
  c.restore();
}

function drawSource(now) {
  if (mode === 'demo') { drawDemo(now, $('demo-close').checked); return; }
  const w = source.width, h = source.height;
  sourceCtx.clearRect(0, 0, w, h);
  const scale = Math.max(w / video.videoWidth, h / video.videoHeight);
  const vw = video.videoWidth * scale, vh = video.videoHeight * scale;
  sourceCtx.save(); sourceCtx.translate(w, 0); sourceCtx.scale(-1, 1);
  sourceCtx.drawImage(video, (w - vw) / 2, (h - vh) / 2, vw, vh); sourceCtx.restore();
}

function snapshot() {
  const image = document.createElement('canvas'); image.width = 480; image.height = Math.round(480 * source.height / source.width);
  image.getContext('2d').drawImage(source, 0, 0, image.width, image.height); return image;
}

function render(now) {
  const w = canvas.width, h = canvas.height;
  ctx.globalAlpha = 1; ctx.fillStyle = '#1d2525'; ctx.fillRect(0, 0, w, h);
  ghosts = ghosts.filter(g => session.elapsed - g.at < 45);
  ghosts.forEach((g, i) => {
    ctx.globalAlpha = .18 * (1 - (session.elapsed - g.at) / 45);
    ctx.drawImage(g.image, (i % 2 ? 1 : -1) * w * .045 * (i + 1), 0, w, h);
  });
  ctx.globalAlpha = session.visibility;
  if (session.fragmentation < .03) ctx.drawImage(source, 0, 0);
  else {
    const columns = 6, rows = 8, tileW = w / columns, tileH = h / rows;
    for (let y = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
      const phase = x * 5.7 + y * 2.3;
      const oscillation = reducedMotion ? .4 : Math.sin(now / 1100 + phase);
      const shiftX = oscillation * 22 * session.fragmentation;
      const shiftY = Math.cos(phase) * 14 * session.fragmentation;
      const gap = 3.5 * session.fragmentation;
      ctx.save(); ctx.beginPath(); ctx.rect(x * tileW + gap, y * tileH + gap, tileW - gap * 2, tileH - gap * 2); ctx.clip();
      ctx.drawImage(source, shiftX, shiftY); ctx.restore();
    }
  }
  ctx.globalAlpha = 1;
}

function updateUI(state, attentive) {
  const descriptions = {
    clear: ['A clear reflection', 'At first, the mirror gives you exactly what you expect.', 'A moment of presence.'],
    fading: ['Slowly disappearing', 'As you linger, the mirror makes your attention visible through absence.', 'The longer you look, the less you see.'],
    fragmented: ['Too close to see clearly', 'Moving closer breaks the reflection into pieces. Step back to let it settle.', 'A reflection in fragments.'],
  };
  const text = descriptions[state];
  $('effect-title').textContent = text[0]; $('effect-copy').textContent = text[1]; $('state-label').textContent = text[2];
  const visibility = Math.round(session.visibility * 100);
  $('visibility').textContent = `${visibility}%`; $('visibility-bar').style.width = `${visibility}%`;
  $('total').textContent = formatTime(session.total); $('streak').textContent = formatTime(session.streak);
  $('checks').textContent = String(session.returns).padStart(2, '0'); $('ghosts').textContent = String(ghosts.length).padStart(2, '0');
  $('tracking-status').textContent = mode === 'demo' ? (attentive ? 'Simulated attention' : 'Simulated looking away') : !face ? 'No face detected' : !baseline ? `Calibrating · ${Math.round(calibration.length / 20 * 100)}%` : attentive ? 'Facing the mirror' : 'Looking away · timer paused';
}

function frame(now) {
  requestAnimationFrame(frame);
  if (!running || document.hidden) { lastTime = now; return; }
  const dt = Math.min((now - lastTime) / 1000, .25); lastTime = now;
  try {
    if (mode === 'webcam') analyze(now);
    const attentive = mode === 'demo' ? $('demo-attention').checked : !!face?.attentive && now - lastDetection < 500;
    const proximity = mode === 'demo' ? ($('demo-close').checked ? 1 : 0) : baseline && face ? clamp((face.width / baseline - closeRatio) / .35, 0, 1) : 0;
    const { returned, state } = session.update(dt, attentive, proximity);
    drawSource(now);
    if (returned && lastVisitFrame) { ghosts.push({ image: lastVisitFrame, at: session.elapsed }); ghosts = ghosts.slice(-4); }
    // Save a frame to show as an echo when the user comes back.
    if (attentive && session.inVisit && now - lastSnapshot > 250) { lastVisitFrame = snapshot(); lastSnapshot = now; }
    render(now); updateUI(state, attentive);
  } catch (error) { finish(); showError(`Tracking stopped: ${error.message}. Try starting a new session.`); }
}
requestAnimationFrame(frame);

function finish(showSummary = true) {
  if (!running) return;
  running = false; report = session.summary(mode);
  releaseCamera(); ghosts = []; lastVisitFrame = null;
  ctx.clearRect(0, 0, canvas.width, canvas.height); sourceCtx.clearRect(0, 0, source.width, source.height);
  $('welcome').hidden = false; $('session-controls').hidden = true; $('demo-controls').hidden = true;
  $('live-dot').classList.remove('active'); $('session-indicator').textContent = 'ENDED';
  $('mode-label').textContent = 'AWAITING YOUR REFLECTION'; $('tracking-status').textContent = 'Camera is off';
  if (showSummary) {
    $('summary-mode').textContent = mode === 'demo' ? 'SIMULATED DEMO' : 'WEBCAM';
    $('summary-time').textContent = `${session.total.toFixed(1)} seconds`;
    $('summary-longest').textContent = formatTime(session.longest);
    $('summary-checks').textContent = session.returns;
    $('summary-length').textContent = formatTime(session.elapsed);
    $('summary').showModal();
  }
}

$('start').addEventListener('click', () => start('webcam'));
$('demo').addEventListener('click', () => start('demo'));
$('end').addEventListener('click', () => finish());
$('calibrate').addEventListener('click', () => { baseline = null; calibration = []; });
$('fade-start').addEventListener('input', event => { fadeStart = +event.target.value; $('fade-output').textContent = fadeStart; if (session) session.fadeStart = fadeStart; });
$('close-ratio').addEventListener('input', event => { closeRatio = +event.target.value; $('close-output').textContent = closeRatio.toFixed(2); });
$('download').addEventListener('click', () => {
  if (!report) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify({ project: 'Echo Mirror', ...report }, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'echo-mirror-session.json'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { showError('Fullscreen is unavailable in this browser. Use your browser’s fullscreen menu instead.'); }
});
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? 'Exit fullscreen ↙' : 'Fullscreen ↗'; });
document.addEventListener('visibilitychange', () => {
  lastTime = performance.now(); face = null;
  // Reset the streak if the page is hidden.
  if (document.hidden && running) { session.streak = 0; session.dwell = 0; session.inVisit = false; }
});
window.addEventListener('pagehide', () => { finish(false); detector?.close(); detector = null; });
