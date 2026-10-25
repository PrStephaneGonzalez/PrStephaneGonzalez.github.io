/** Canonical, immutable graph. L = Red/Black; R = Blue/White. */
export const other = player => {
  if (player !== 'L' && player !== 'R') throw new TypeError('Player must be L or R');
  return player === 'L' ? 'R' : 'L';
};

export function createGraph({ vertices, arcs }) {
  if (!Array.isArray(vertices) || !Array.isArray(arcs)) throw new TypeError('Expected vertices and arcs');
  const index = Object.create(null);
  const nodes = vertices.map(({ id, color }, i) => {
    if (typeof id !== 'string' || !id || Object.hasOwn(index, id)) throw new TypeError('Unique nonempty string IDs required');
    other(color);
    index[id] = i;
    return Object.freeze({ id, color });
  });
  const bits = nodes.map((_, i) => 1n << BigInt(i));
  const outgoing = nodes.map(() => 0n), incoming = nodes.map(() => 0n);
  const seen = new Set();
  const edges = arcs.map(edge => {
    if (!Array.isArray(edge) || edge.length !== 2 || edge.some(id => typeof id !== 'string' || !Object.hasOwn(index, id))) {
      throw new TypeError('Each arc must connect existing vertices');
    }
    const [from, to] = edge, a = index[from], b = index[to];
    const key = `${a}:${b}`;
    if (seen.has(key)) throw new TypeError('Duplicate arc');
    seen.add(key);
    outgoing[a] |= bits[b]; incoming[b] |= bits[a];
    return Object.freeze([from, to]);
  });
  const masks = { L: 0n, R: 0n };
  nodes.forEach((v, i) => { masks[v.color] |= bits[i]; });
  return Object.freeze({
    vertices: Object.freeze(nodes), arcs: Object.freeze(edges), index: Object.freeze(index),
    bits: Object.freeze(bits), outgoing: Object.freeze(outgoing), incoming: Object.freeze(incoming),
    colors: Object.freeze(masks), full: (1n << BigInt(nodes.length)) - 1n,
  });
}

export function definition(graph) {
  return { vertices: graph.vertices.map(v => ({ ...v })), arcs: graph.arcs.map(a => [...a]) };
}

export function validateMask(graph, mask) {
  if (typeof mask !== 'bigint' || mask < 0n || (mask & graph.full) !== mask) throw new RangeError('Invalid remaining mask');
}

export function popcount(mask) {
  if (typeof mask !== 'bigint' || mask < 0n) throw new RangeError('Expected nonnegative BigInt');
  let n = 0;
  while (mask) { mask &= mask - 1n; n++; }
  return n;
}

export function ids(graph, mask) {
  validateMask(graph, mask);
  return graph.vertices.filter((_, i) => mask & graph.bits[i]).map(v => v.id);
}

/** BFS on the CURRENT induced graph, never on a precomputed full closure. */
export function reachMask(graph, remaining, id, player) {
  other(player); validateMask(graph, remaining);
  const i = graph.index[id];
  if (i === undefined || !(remaining & graph.bits[i])) throw new RangeError('Vertex absent');
  const adjacency = player === 'L' ? graph.outgoing : graph.incoming;
  let reached = graph.bits[i], frontier = reached;
  while (frontier) {
    let next = 0n;
    for (let j = 0; j < graph.vertices.length; j++) if (frontier & graph.bits[j]) next |= adjacency[j];
    next &= remaining & ~reached;
    reached |= next; frontier = next;
  }
  return reached;
}

export function captureMask(graph, remaining, player, id) {
  other(player);
  if (graph.vertices[graph.index[id]]?.color !== player) throw new RangeError('Illegal color or unknown vertex');
  return reachMask(graph, remaining, id, player);
}

export function legalMoves(graph, remaining, player) {
  other(player); validateMask(graph, remaining);
  return ids(graph, remaining & graph.colors[player]);
}

/** View projection only: canonical arcs are never mutated. */
export function displayedArcs(graph, remaining, player) {
  other(player); validateMask(graph, remaining);
  return graph.arcs.filter(([a, b]) => (remaining & graph.bits[graph.index[a]]) && (remaining & graph.bits[graph.index[b]]))
    .map(([a, b]) => player === 'L' ? [a, b] : [b, a]);
}

export function inducedGraph(graph, remaining) {
  validateMask(graph, remaining);
  return createGraph({ vertices: graph.vertices.filter((_, i) => remaining & graph.bits[i]), arcs: displayedArcs(graph, remaining, 'L') });
}

export function opposite(graph) {
  return createGraph({ vertices: graph.vertices.map(v => ({ id: v.id, color: other(v.color) })), arcs: graph.arcs.map(([a, b]) => [b, a]) });
}

export function disjointUnion(...graphs) {
  return createGraph({
    vertices: graphs.flatMap((g, i) => g.vertices.map(v => ({ id: `${i}/${v.id}`, color: v.color }))),
    arcs: graphs.flatMap((g, i) => g.arcs.map(([a, b]) => [`${i}/${a}`, `${i}/${b}`])),
  });
}
