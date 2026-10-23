import { solvePotion } from './engine.mjs';
self.onmessage = (e) => {
  try {
    self.postMessage({ moves: solvePotion(e.data.board, e.data.cap, 70000) });
  } catch {
    self.postMessage({ moves: null });
  }
};
