// Robotens tenking skjer i en egen tråd, så brettet ikke fryser mens den tenker.
import { bestMove, type State } from './engine';

self.onmessage = (e: MessageEvent<{ id: number; state: State; level: number }>) => {
  const { id, state, level } = e.data;
  const move = bestMove(state, level);
  (self as unknown as Worker).postMessage({ id, move });
};
