// Web Audio API Chimes for CHRONO by TENAZITY

let sharedCtx = null;

function getAudioContext() {
  try {
    if (!sharedCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        sharedCtx = new AudioCtx();
      }
    }
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(err => console.warn('AudioContext resume error:', err));
    }
    return sharedCtx;
  } catch (e) {
    console.warn('AudioContext creation error:', e);
    return null;
  }
}

// Unlock audio on first user gesture (Start button, Sound toggle, etc.)
export function unlockAudio() {
  getAudioContext();
}

// 1. Focus Session Completion Chime (Warm, serene F Major 7th chord: F4, A4, C5, E5)
export function playFocusChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [349.23, 440.00, 523.25, 659.25]; // F4, A4, C5, E5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.14; // soft arpeggio stagger
      const duration = 2.4;

      // Audible envelope: gentle attack, smooth exponential decay
      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.25 / (i * 0.3 + 1), startTime + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn('Audio focus chime error:', e);
  }
}

// 2. Break Completion Chime (Refreshing, energizing C Major triad: C5, E5, G5, C6)
export function playBreakChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i === 3 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.11; // crisp ascending bell chime
      const duration = 1.8;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.3 / (i * 0.25 + 1), startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn('Audio break chime error:', e);
  }
}

// Backward compatibility alias
export const playChime = playFocusChime;

// ── Huberman Soundscapes ──────────────────────────────────────────────────────

let activeSoundscape = null;

export function stopSoundscape() {
  if (activeSoundscape) {
    try {
      activeSoundscape.stop();
    } catch (e) {}
    activeSoundscape = null;
  }
}

export function startBinauralBeats() {
  stopSoundscape();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    // 40Hz binaural beats (e.g. 400Hz and 440Hz)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const panner1 = ctx.createStereoPanner();
    const panner2 = ctx.createStereoPanner();
    const gain = ctx.createGain();

    osc1.frequency.value = 400;
    osc2.frequency.value = 440;

    panner1.pan.value = -1; // Left ear
    panner2.pan.value = 1;  // Right ear

    gain.gain.value = 0.05; // Low volume background

    osc1.connect(panner1);
    osc2.connect(panner2);
    panner1.connect(gain);
    panner2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeSoundscape = {
      stop: () => {
        osc1.stop();
        osc2.stop();
        osc1.disconnect();
        osc2.disconnect();
        gain.disconnect();
      }
    };
  } catch (e) {
    console.warn('Binaural beats error:', e);
  }
}

export function startPinkNoise() {
  stopSoundscape();
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
      output[i] *= 0.11; 
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    noiseSource.connect(gain);
    gain.connect(ctx.destination);
    noiseSource.start();

    activeSoundscape = {
      stop: () => {
        noiseSource.stop();
        noiseSource.disconnect();
        gain.disconnect();
      }
    };
  } catch (e) {
    console.warn('Pink noise error:', e);
  }
}
