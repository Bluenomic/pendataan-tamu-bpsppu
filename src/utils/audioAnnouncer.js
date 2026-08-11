// Audio & Speech Announcer for BPS Queue System
// Uses Web Audio API for chime sound and Web Speech API for voice announcement

let audioCtx = null;
let cachedVoices = [];

function refreshVoices() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    cachedVoices = window.speechSynthesis.getVoices() || [];
  }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }
}

// Strict Helper: Find Indonesian Voice (Never match Hindi 'hi-IN' or other '*-IN' regions!)
export function findIndonesianVoice(voicesList = []) {
  const voices = voicesList.length > 0 ? voicesList : (typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : cachedVoices);
  if (!Array.isArray(voices) || voices.length === 0) return null;

  // 1. Strict check for Indonesian language tag (id-ID, id_ID, id)
  let match = voices.find(v => {
    if (!v || !v.lang) return false;
    const l = v.lang.toLowerCase().trim();
    return l === 'id-id' || l === 'id_id' || l === 'id' || l.startsWith('id-') || l.startsWith('id_');
  });
  if (match) return match;

  // 2. Check voice name for Indonesian indicators (Indonesia, Indonesian, Bahasa, Gadis, Andika)
  match = voices.find(v => {
    if (!v || !v.name) return false;
    const n = v.name.toLowerCase();
    return n.includes('indonesia') || n.includes('indonesian') || n.includes('bahasa') || n.includes('gadis') || n.includes('andika');
  });
  if (match) return match;

  // 3. Fallback: Search for Malay (ms-MY) if Indonesian is not available
  match = voices.find(v => v && v.lang && v.lang.toLowerCase().startsWith('ms'));
  if (match) return match;

  return null;
}

export function unlockAudioContext() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
    }
  } catch (e) {
    console.warn('[AudioAnnouncer] AudioContext unlock notice:', e);
  }
}

export function getIndonesianVoiceInfo() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return { hasIdVoice: false, voiceName: 'Web Speech API Tidak Didukung' };
  }
  const voices = window.speechSynthesis.getVoices() || cachedVoices;
  const idVoice = findIndonesianVoice(voices);

  if (idVoice) {
    return { hasIdVoice: true, voiceName: `${idVoice.name} (${idVoice.lang})` };
  }

  const defaultVoice = voices.find(v => v.default) || voices[0];
  return { 
    hasIdVoice: false, 
    voiceName: defaultVoice ? `${defaultVoice.name} (${defaultVoice.lang}) [Disarankan pakai Chrome/Edge]` : 'Suara Default System' 
  };
}

// Play pleasant 3-tone chime (C5 -> E5 -> G5)
export function playChimeSound() {
  try {
    unlockAudioContext();
    if (!audioCtx) return Promise.resolve();

    const now = audioCtx.currentTime;
    const tones = [
      { freq: 523.25, time: now, duration: 0.2 },       // C5
      { freq: 659.25, time: now + 0.2, duration: 0.2 }, // E5
      { freq: 783.99, time: now + 0.4, duration: 0.45 }  // G5
    ];

    tones.forEach(({ freq, time, duration }) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.01, time);
      gain.gain.exponentialRampToValueAtTime(0.35, time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(time);
      osc.stop(time + duration);
    });

    return new Promise((resolve) => setTimeout(resolve, 850));
  } catch (e) {
    console.warn('[AudioAnnouncer] AudioContext chime failed:', e);
    return Promise.resolve();
  }
}

// Format Queue Number for speech (e.g. "A-005" -> "Nomor antrean A. nol. nol. lima")
export function formatQueueNumberForSpeech(noAntrean) {
  if (!noAntrean) return '';
  const clean = String(noAntrean).trim().toUpperCase();
  const parts = clean.split('-');

  if (parts.length === 2) {
    const prefix = parts[0];
    const numDigits = parts[1].split('').map(digit => {
      switch (digit) {
        case '0': return 'nol';
        case '1': return 'satu';
        case '2': return 'dua';
        case '3': return 'tiga';
        case '4': return 'empat';
        case '5': return 'lima';
        case '6': return 'enam';
        case '7': return 'tujuh';
        case '8': return 'delapan';
        case '9': return 'sembilan';
        default: return digit;
      }
    }).join('. ');
    return `Nomor antrean ${prefix}. ${numDigits}`;
  }

  return `Nomor antrean ${clean}`;
}

// Announce Queue Call with Chime + Voice Synthesis
export async function announceQueueCall(noAntrean, destinationUnit = 'Pelayanan Statistik Terpadu') {
  unlockAudioContext();

  // 1. Play chime sound
  await playChimeSound();

  if (!('speechSynthesis' in window)) {
    console.warn('[AudioAnnouncer] Web Speech API not supported in this browser.');
    return;
  }

  // 2. Prepare speech text
  const formattedNo = formatQueueNumberForSpeech(noAntrean);
  const unitClean = destinationUnit ? destinationUnit.replace(/\(PST\)/gi, '').trim() : 'Pelayanan Statistik Terpadu';
  const speechText = `${formattedNo}. Silakan menuju ${unitClean}.`;

  // 3. Stop previous utterances
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.lang = 'id-ID';
  utterance.rate = 0.85; // Relaxed rate for clear lobby acoustics
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // Try to find Indonesian voice with strict filter
  const voices = window.speechSynthesis.getVoices() || cachedVoices;
  const idVoice = findIndonesianVoice(voices);

  if (idVoice) {
    utterance.voice = idVoice;
  }

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 100);
}
