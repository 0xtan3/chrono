// Web Audio API Sound System for CHRONO
// Synthesized in real-time — zero network asset dependencies

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

// Unlock audio on first user gesture
export function unlockAudio() {
  getAudioContext();
}

// ── 1. Standard Focus Session Completion Chime (F Major 7th arpeggio) ───────────
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

      const startTime = ctx.currentTime + i * 0.14;
      const duration = 2.4;

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

// ── 2. Break / Recovery Completion Chime (C Major triad) ───────────────────────
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

      const startTime = ctx.currentTime + i * 0.11;
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

// ── 3. Critical XP Reward Chime (Energetic sparkle) ────────────────────────────
export function playCriticalChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880.00, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.07;
      const duration = 2.2;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn('Audio critical chime error:', e);
  }
}

// ── 4. Legendary Drop Chime (Epic Fanfare) ─────────────────────────────────────
export function playLegendaryChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const chords = [
      { time: 0, notes: [440, 554.37, 659.25] },     // A Maj
      { time: 0.18, notes: [493.88, 622.25, 739.99] }, // B Maj
      { time: 0.42, notes: [554.37, 698.46, 880.00, 1108.73] }, // C# Maj octave
    ];

    chords.forEach((chord) => {
      chord.notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === chord.notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const startTime = ctx.currentTime + chord.time;
        const duration = 2.8;

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.linearRampToValueAtTime(0.22 / (idx * 0.2 + 1), startTime + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    });
  } catch (e) {
    console.warn('Audio legendary chime error:', e);
  }
}

// ── 5. Level Up Chime (Ascending triumphant sparkle) ───────────────────────────
export function playLevelUpChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + i * 0.08;
      const duration = 2.0;

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.3, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  } catch (e) {
    console.warn('Audio level up chime error:', e);
  }
}

// ── Soundscapes (40Hz Gamma Focus Beat & Pink Noise) ──────────────────────────

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

    // 40Hz Gamma Wave entrainment (400Hz left ear, 440Hz right ear)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const panner1 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const panner2 = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const gain = ctx.createGain();

    osc1.frequency.value = 400;
    osc2.frequency.value = 440;

    gain.gain.value = 0.05; // Gentle background bed

    if (panner1 && panner2) {
      panner1.pan.value = -1; // Left
      panner2.pan.value = 1;  // Right
      osc1.connect(panner1);
      osc2.connect(panner2);
      panner1.connect(gain);
      panner2.connect(gain);
    } else {
      osc1.connect(gain);
      osc2.connect(gain);
    }

    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();

    activeSoundscape = {
      stop: () => {
        try {
          osc1.stop();
          osc2.stop();
          osc1.disconnect();
          osc2.disconnect();
          gain.disconnect();
        } catch (e) {}
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
        try {
          noiseSource.stop();
          noiseSource.disconnect();
          gain.disconnect();
        } catch (e) {}
      }
    };
  } catch (e) {
    console.warn('Pink noise error:', e);
  }
}
