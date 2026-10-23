import { normalizeCode } from './sync.mjs';
// Fragment contents are kept out of server request URLs. Authentication is still required.
export function createTravelLink(base, code) {
  const u = new URL(base);
  u.search = '';
  u.hash =
    'voyage=' +
    normalizeCode(code)
      .match(/.{1,5}/g)
      .join('-');
  return u.href;
}
export function travelCodeFromLink(hash) {
  try {
    const value = new URLSearchParams(hash.replace(/^#/, '')).get('voyage');
    if (!value) return null;
    const code = normalizeCode(value);
    return /^[A-HJ-NP-Z2-9]{20}$/.test(code) ? code.match(/.{1,5}/g).join('-') : null;
  } catch {
    return null;
  }
}
