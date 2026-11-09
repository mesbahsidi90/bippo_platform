export const alertTones = {
  pager: 'بيجر',
  marimba: 'ماريمبا',
  crystal: 'كريستال',
  classic: 'كلاسيك'
};

export const toneKey = key => Object.hasOwn(alertTones, key) ? key : 'pager';
const sounds = { pager: '/order-alert-v2.wav', classic: '/order-chime.wav' };
const generated = {};

// Short original chimes, rendered once and reused for preview and ringing.
export function toneSource(key) {
  const tone = toneKey(key);
  if (sounds[tone]) return sounds[tone];
  if (generated[tone]) return generated[tone];
  const rate = 16000;
  const samples = Math.floor(rate * 1.22);
  const wav = new DataView(new ArrayBuffer(44 + samples * 2));
  for (const [offset, text] of [[0, 'RIFF'], [8, 'WAVEfmt '], [36, 'data']]) {
    for (let index = 0; index < text.length; index++) wav.setUint8(offset + index, text.charCodeAt(index));
  }
  wav.setUint32(4, 36 + samples * 2, true);
  wav.setUint32(16, 16, true);
  wav.setUint16(20, 1, true);
  wav.setUint16(22, 1, true);
  wav.setUint32(24, rate, true);
  wav.setUint32(28, rate * 2, true);
  wav.setUint16(32, 2, true);
  wav.setUint16(34, 16, true);
  wav.setUint32(40, samples * 2, true);
  const marimba = tone === 'marimba';
  const notes = marimba ? [523.25, 659.25, 783.99, 1046.5] : [783.99, 1174.66, 1567.98];
  for (let i = 0; i < samples; i++) {
    const time = i / rate;
    const signal = notes.reduce((sum, pitch, index) => {
      const age = time - index * (marimba ? .17 : .21);
      if (age < 0 || age >= .48) return sum;
      const angle = 2 * Math.PI * pitch * age;
      const envelope = Math.min(1, age / .012, (.48 - age) / .06) * Math.exp(-age * (marimba ? 10 : 6));
      return sum + envelope * (Math.sin(angle) + .18 * Math.sin(angle * (marimba ? 3 : 2.7)));
    }, 0);
    wav.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(signal * 14000))), true);
  }
  const bytes = new Uint8Array(wav.buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  generated[tone] = 'data:audio/wav;base64,' + btoa(binary);
  return generated[tone];
}
