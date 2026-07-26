// Chill Lofi & Cinematic Space Track Pool Engine for CHRONO
import { useStore } from '../store';

export const LOFI_PLAYLIST = [
  // Interstellar / Cinematic Space Vibes
  {
    id: 'space_deep',
    title: 'Deep Space Organ',
    genre: 'Cinematic Space',
    streamUrl: 'https://cdn.pixabay.com/audio/2022/11/22/audio_febc508520.mp3'
  },
  {
    id: 'space_epic',
    title: 'Interstellar Journey',
    genre: 'Cinematic Space',
    streamUrl: 'https://cdn.pixabay.com/audio/2021/11/23/audio_88c7d853e3.mp3'
  },
  {
    id: 'space_ambient',
    title: 'Sci-Fi Cosmos',
    genre: 'Cinematic Space',
    streamUrl: 'https://cdn.pixabay.com/audio/2022/10/25/audio_249db7120a.mp3'
  },
  // Chill Lofi
  {
    id: 'lofi_chillhop',
    title: 'Late Night Coffee',
    genre: 'Chill Lofi',
    streamUrl: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3'
  },
  {
    id: 'lofi_study',
    title: 'Focus Beats',
    genre: 'Chill Lofi',
    streamUrl: 'https://cdn.pixabay.com/audio/2022/04/27/audio_82c61e8eb1.mp3'
  }
];

let audioEl = null;
let currentTrackIndex = 0;

function getAudioElement() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.crossOrigin = 'anonymous';
    audioEl.preload = 'none';

    // Auto-advance when track ends, maintaining volume!
    audioEl.addEventListener('ended', () => {
      skipToNextLofiTrack();
    });
  }
  return audioEl;
}

export function playLofi(forceTrackIndex = null) {
  try {
    const audio = getAudioElement();

    if (forceTrackIndex !== null) {
      currentTrackIndex = forceTrackIndex % LOFI_PLAYLIST.length;
    }

    const currentTrack = LOFI_PLAYLIST[currentTrackIndex];
    if (audio.src !== currentTrack.streamUrl) {
      audio.src = currentTrack.streamUrl;
    }

    // Pull volume DIRECTLY from the Zustand store, guaranteeing it adheres
    const vol = useStore.getState().lofiVolume;
    audio.volume = Math.max(0, Math.min(1, vol));
    
    const p = audio.play();
    if (p !== undefined) {
      p.catch(err => console.warn('Playback warning (requires user interaction first):', err));
    }

    return currentTrack;
  } catch (err) {
    console.warn('Audio play error:', err);
    return LOFI_PLAYLIST[0];
  }
}

export function skipToNextLofiTrack() {
  // Pick a DIFFERENT track index from the current one
  let nextIndex = (currentTrackIndex + 1) % LOFI_PLAYLIST.length;
  if (nextIndex === currentTrackIndex && LOFI_PLAYLIST.length > 1) {
    nextIndex = (nextIndex + 1) % LOFI_PLAYLIST.length;
  }
  currentTrackIndex = nextIndex;
  return playLofi(currentTrackIndex);
}

export function pauseLofi() {
  if (audioEl) {
    audioEl.pause();
  }
}

export function setLofiVolume(vol = 0.5) {
  if (audioEl) {
    audioEl.volume = Math.max(0, Math.min(1, vol));
  }
}

export function getCurrentLofiTrack() {
  return LOFI_PLAYLIST[currentTrackIndex];
}
