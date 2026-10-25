#!/usr/bin/env python3
"""Independent reference: plain vertex sets, Floyd-Warshall, absolute scores.

No imports from the JS implementation, no memoization and no move pruning.
Input: one JSON request. Output: one self-contained test case per JSON line.
"""
import itertools
import json
import random
import sys


def outcome(vertices, arcs, player):
    playable = [v for v in vertices if v['color'] == player]
    if not playable:
        return (0, len(vertices)) if player == 'L' else (len(vertices), 0)
    names = [v['id'] for v in vertices]
    index = {name: i for i, name in enumerate(names)}
    reach = [[i == j for j in range(len(names))] for i in range(len(names))]
    for a, b in arcs:
        reach[index[a]][index[b]] = True
    for k in range(len(names)):
        for i in range(len(names)):
            for j in range(len(names)):
                reach[i][j] = reach[i][j] or (reach[i][k] and reach[k][j])
    outcomes = []
    for v in playable:
        at = index[v['id']]
        taken = {name for i, name in enumerate(names)
                 if (reach[at][i] if player == 'L' else reach[i][at])}
        rest = [x for x in vertices if x['id'] not in taken]
        edges = [(a, b) for a, b in arcs if a not in taken and b not in taken]
        left, right = outcome(rest, edges, 'R' if player == 'L' else 'L')
        outcomes.append((left + (len(taken) if player == 'L' else 0),
                         right + (len(taken) if player == 'R' else 0)))
    return max(outcomes, key=lambda x: x[0]) if player == 'L' else max(outcomes, key=lambda x: x[1])


def emit(graph, family):
    l = outcome(graph['vertices'], graph['arcs'], 'L')
    r = outcome(graph['vertices'], graph['arcs'], 'R')
    print(json.dumps({'graph': graph, 'family': family, 'left': l, 'right': r}, separators=(',', ':')))


def run(request):
    for n in range(request.get('max_exhaustive', 4) + 1):
        pairs = list(itertools.permutations(range(n), 2))
        for flags in itertools.product((False, True), repeat=len(pairs)):
            arcs = [[str(a), str(b)] for (a, b), flag in zip(pairs, flags) if flag]
            for colors in itertools.product(('L', 'R'), repeat=n):
                emit({'vertices': [{'id': str(i), 'color': c} for i, c in enumerate(colors)], 'arcs': arcs}, 'exhaustive')
    rng = random.Random(request.get('seed', 20261025))
    for k in range(request.get('random_count', 1000)):
        n = 5 + k % 6  # sizes 5,6,...,10, including cycles and self-loops
        density = (0, .08, .2, .5, .9)[k % 5]
        vertices = [{'id': str(i), 'color': rng.choice(('L', 'R'))} for i in range(n)]
        arcs = [[str(i), str(j)] for i in range(n) for j in range(n) if rng.random() < density]
        emit({'vertices': vertices, 'arcs': arcs}, 'random')
    for graph in request.get('graphs', []):
        emit(graph, 'provided')


if __name__ == '__main__':
    run(json.load(sys.stdin))
