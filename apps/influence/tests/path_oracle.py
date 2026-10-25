#!/usr/bin/env python3
"""Additional exact checker for long paths, using structural isomorphisms.

This checker DOES memoize, unlike oracle.py. A whole position is a sorted
multiset of alternating runs (length, first color). We search moves in the
whole multiset; we NEVER add the values of its connected components.
No forced vertices are removed and no dominance rule is used.
"""
import functools
import json
import sys
import time


def canonical(parts):
    # Reversing an even path preserves the colored oriented graph up to
    # isomorphism, so its first color may be normalized to 0 (= L).
    return tuple(sorted((n, color if n % 2 else 0) for n, color in parts if n))


@functools.cache
def absolute(parts, player):
    total = sum(n for n, _ in parts)
    outcomes = []
    for component, (n, color) in enumerate(parts):
        for i in range(n):
            if (color + i) % 2 != player:
                continue
            lo, hi = max(0, i - 1), min(n, i + 2)
            remaining = list(parts[:component] + parts[component + 1:])
            remaining += [(lo, color), (n - hi, (color + hi) % 2)]
            left, right = absolute(canonical(remaining), 1 - player)
            outcomes.append((left + (hi - lo if player == 0 else 0),
                             right + (hi - lo if player == 1 else 0)))
    if not outcomes:
        return (0, total) if player == 0 else (total, 0)
    return max(outcomes, key=lambda scores: scores[player])


def run(maximum):
    start = time.monotonic()
    for n in range(1, maximum + 1):
        parts = canonical([(n, 1)])  # 1..n, odd = R, even = L
        left = absolute(parts, 0)
        right = absolute(parts, 1)
        print(json.dumps({'n': n, 'Ls': left[0] - left[1], 'Rs': right[0] - right[1],
                          'states': absolute.cache_info().currsize,
                          'elapsedMs': round((time.monotonic() - start) * 1000)}), flush=True)


if __name__ == '__main__':
    run(int(sys.argv[1]) if len(sys.argv) > 1 else 38)
