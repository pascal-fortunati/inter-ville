let audioCtx;
let unlocked = false;
function ensure() {
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return false;
    audioCtx = new Ctx();
  }
  if (audioCtx.state === 'suspended') {
    try { audioCtx.resume(); } catch { void 0 }
  }
  return !!audioCtx && audioCtx.state === 'running';
}
function setupUnlock() {
  if (unlocked) return;
  if (ensure()) { unlocked = true; return; }
  const handler = () => { if (ensure()) { unlocked = true; } };
  ['click','keydown','touchstart'].forEach(ev => { window.addEventListener(ev, handler, { once: true, capture: true }); });
}
setupUnlock();
function pref(key, def = true) {
  try {
    const v = localStorage.getItem(key);
    if (v == null) return def;
    return v !== 'false';
  } catch {
    return def;
  }
}
function volPct(key, def = 60) {
  try {
    const v = Number(localStorage.getItem(key));
    return Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : def;
  } catch {
    return def;
  }
}
function volumeFromPref(key, defPct) {
  const pct = volPct(key, defPct);
  return Math.max(0.01, Math.min(0.5, (pct / 100) * 0.3));
}
function beep(freq = 880, duration = 0.12, volume = 0.08) {
  if (!ensure()) return;
  const ctx = audioCtx;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration + 0.02);
}
export function playNotificationSound() {
  if (!pref('pref:notifySound', true)) return;
  beep(920, 0.12, volumeFromPref('pref:notifySoundVol', 60));
}
export function playChatSound() {
  if (!pref('pref:chatSound', true)) return;
  beep(660, 0.12, volumeFromPref('pref:chatSoundVol', 55));
}
