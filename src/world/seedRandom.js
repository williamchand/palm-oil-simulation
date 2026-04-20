/**
 * Creates a seeded pseudo-random number generator using mulberry32 algorithm.
 * Same seed always produces same sequence of random numbers.
 * 
 * @param {number} seed - Integer seed value
 * @returns {{next: () => number, range: (min: number, max: number) => number, rangeInt: (min: number, max: number) => number}}
 */
export function createSeededRandom(seed) {
  let state = seed >>> 0; // Ensure unsigned 32-bit integer

  function next() {
    state |= 0;
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function rangeInt(min, max) {
    return Math.floor(range(min, max + 1));
  }

  return { next, range, rangeInt };
}
