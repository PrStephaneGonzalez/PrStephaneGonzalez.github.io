// Tests de la logique d'ordonnancement : node --test apps/scw-2028/tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse, parseHint, parseIds, wouldCycle, nextId, prefixFor, phaseOf, people } from '../model.js';

const task = (id, extra = {}) => ({ id, title: id, domain: 'General', priority: 'Medium', status: 'To do', dependsOn: '', planningDate: '', due: '', timing: '', startWhen: '', person: '', ...extra });

test('repères temporels en texte libre', () => {
  assert.equal(parseHint('Internal target: 15/12/2026'), '2026-12');
  assert.equal(parseHint('Q2-Q3 2027'), '2027-04');
  assert.equal(parseHint('Q3 2027-Q1 2028'), '2027-07');
  assert.equal(parseHint('October–November 2026'), '2026-10');
  assert.equal(parseHint('Autumn 2027'), '2027-09');
  assert.equal(parseHint('30 days before the conference'), '2028-05');
  assert.equal(parseHint('14 days after the conference'), '2028-06');
  assert.equal(parseHint('Before the conference'), '2028-06');
  assert.equal(parseHint('2027-2028'), '2027-01');
  assert.equal(parseHint('After the venue visit'), null);
});

test('identifiants cités', () => {
  assert.deepEqual(parseIds('CAL-008, bud-001 and CAL-008'), ['CAL-008', 'BUD-001']);
});

test("une tâche n'apparaît jamais avant ses prérequis, même si elle est datée plus tôt", () => {
  const a = analyse([
    task('BB-001', { dependsOn: 'AA-001', planningDate: '2026-10-01', priority: 'Urgent' }),
    task('AA-001', { planningDate: '2027-03-01' }),
    task('CC-001', { planningDate: '2026-12-01' }),
  ]);
  assert.deepEqual(a.order, ['CC-001', 'AA-001', 'BB-001']);
  assert.equal(a.month.get('BB-001'), '2027-03'); // hérite du repère de son prérequis
});

test('à repère égal, la priorité départage', () => {
  const a = analyse([task('XX-002', { priority: 'Low', timing: 'Q1 2027' }), task('XX-001', { priority: 'Urgent', timing: 'Q1 2027' })]);
  assert.deepEqual(a.order, ['XX-001', 'XX-002']);
});

test('tâches prêtes, attentes et tâches débloquées', () => {
  const a = analyse([
    task('AA-001', { status: 'Done' }),
    task('BB-001', { dependsOn: 'AA-001' }),
    task('CC-001', { dependsOn: 'BB-001' }),
    task('DD-001', { dependsOn: 'CC-001, BB-001' }),
  ]);
  assert.deepEqual([...a.ready], ['BB-001']);
  assert.deepEqual(a.waitingOn.get('DD-001'), ['CC-001', 'BB-001']);
  assert.equal(a.unlocks.get('BB-001'), 2);
});

test('les boucles sont signalées sans bloquer le reste', () => {
  const a = analyse([task('AA-001', { dependsOn: 'BB-001' }), task('BB-001', { dependsOn: 'AA-001' }), task('CC-001')]);
  assert.deepEqual([...a.inCycle].sort(), ['AA-001', 'BB-001']);
  assert.equal(a.order[0], 'CC-001');
  assert.equal(a.order.length, 3);
});

test('détection des boucles avant enregistrement', () => {
  const ts = [task('AA-001'), task('BB-001', { dependsOn: 'AA-001' }), task('CC-001', { dependsOn: 'BB-001' })];
  assert.equal(wouldCycle(ts, 'AA-001', ['CC-001']), true);
  assert.equal(wouldCycle(ts, 'CC-001', ['AA-001']), false);
});

test('cibles dépassées', () => {
  const a = analyse([task('AA-001', { planningDate: '2026-10-01' }), task('BB-001', { planningDate: '2026-10-01', status: 'Done' })], { today: '2026-11-16' });
  assert.deepEqual([...a.overdue], ['AA-001']);
});

test('identifiants des nouvelles tâches', () => {
  const ts = [task('BUD-001', { domain: 'Budget & funding' }), task('BUD-012', { domain: 'Budget & funding' })];
  assert.equal(prefixFor(ts, 'Budget & funding'), 'BUD');
  assert.equal(nextId(ts, 'BUD'), 'BUD-013');
  assert.equal(nextId(ts, 'GEN'), 'GEN-001');
});

test('phases et personnes', () => {
  assert.equal(phaseOf('2026-11'), 'now');
  assert.equal(phaseOf('2027-09'), '2027h2');
  assert.equal(phaseOf('2028-06'), 'conference');
  assert.equal(phaseOf(null), 'undated');
  assert.deepEqual(people('Taï / Lyon 2 '), ['Taï', 'Lyon 2']);
});
