// Tests de la logique d'ordonnancement : node --test apps/scw-2028/tests/
import test from 'node:test';
import assert from 'node:assert/strict';
import { analyse, parseHint, parseIds, wouldCycle, nextId, prefixFor, phaseOf, people, targetDate, milestoneDates, addDays, labelsFor, concerns, wouldUnlock, agenda, csvCell } from '../model.js';

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

test("une tâche n'apparaît jamais avant ses prérequis ; le prérequis hérite de l'échéance et de l'importance", () => {
  const a = analyse([
    task('BB-001', { dependsOn: 'AA-001', planningDate: '2027-01-10', priority: 'Urgent', effort: 'days' }),
    task('AA-001', { planningDate: '2027-03-01', priority: 'Low' }),
    task('CC-001', { planningDate: '2026-12-01' }),
  ], { today: '2026-11-16' });
  assert.deepEqual(a.order, ['CC-001', 'AA-001', 'BB-001']);
  assert.equal(a.deadline.get('AA-001').date, '2027-01-07'); // 10 janvier − 3 jours pour BB-001
  assert.equal(a.deadline.get('AA-001').source, 'needed');
  assert.equal(a.weight.get('AA-001'), 8); // urgente, comme la tâche qui l'attend
});

test('score : à échéance proche, la tâche importante et courte passe d’abord', () => {
  const a = analyse([
    task('AA-001', { planningDate: '2026-12-01', priority: 'Low', effort: 'hours' }),
    task('BB-001', { planningDate: '2026-12-01', priority: 'Urgent', effort: 'weeks' }),
    task('CC-001', { planningDate: '2026-12-01', priority: 'Urgent', effort: 'hours' }),
    task('DD-001', { planningDate: '2026-10-01', priority: 'Low' }),
    task('EE-001', { planningDate: '2027-09-01', priority: 'Urgent', effort: 'hours' }),
  ], { today: '2026-11-16' });
  assert.deepEqual(a.order, ['DD-001', 'CC-001', 'BB-001', 'AA-001', 'EE-001']);
  assert.deepEqual([...a.late], ['DD-001']);
  assert.equal(a.horizon.get('CC-001'), 'month');
  assert.equal(a.horizon.get('EE-001'), 'y2027');
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

test('dates cibles : échéance, cible interne, puis jalon et décalage', () => {
  const ms = milestoneDates([{ key: 'reg-open', date: '2028-03-10' }]);
  assert.deepEqual(targetDate(task('AA-001', { anchor: 'reg-open', anchorOffset: -14 }), ms), { date: '2028-02-25', source: 'anchor' });
  assert.equal(targetDate(task('AA-002', { anchor: 'reg-open', planningDate: '2027-01-01' }), ms).source, 'planning');
  assert.equal(targetDate(task('AA-003', { anchor: 'unknown' }), ms), null);
  assert.equal(addDays('2028-03-01', -1), '2028-02-29');
});

test('un jalon déplace les tâches qui y sont rattachées', () => {
  const ts = [task('AA-001', { anchor: 'conf', anchorOffset: -30 })];
  const a = analyse(ts, { milestones: [{ key: 'conf', date: '2028-06-06' }] });
  assert.equal(a.target.get('AA-001').date, '2028-05-07');
  assert.equal(a.conference, '2028-06');
});

test('les règles et rituels ne bloquent pas et ne sont pas « prêts »', () => {
  const a = analyse([task('RR-001', { kind: 'rule' }), task('BB-001', { dependsOn: 'RR-001' }), task('CC-001', { kind: 'recurring' })]);
  assert.deepEqual([...a.ready], ['BB-001']);
  assert.deepEqual(a.waitingOn.get('BB-001'), []);
});

test('mes tâches : prénom et rôles tenus', () => {
  const roles = [{ role: 'Budget lead', holder: 'Antoinette, Zoi' }, { role: 'Programme Chair', holder: '' }];
  assert.deepEqual(labelsFor('zoi', roles), ['zoi', 'Budget lead']);
  assert.equal(concerns(task('BB-001', { person: 'LOC / Budget lead' }), labelsFor('Zoi', roles)), true);
  assert.equal(concerns(task('BB-002', { person: 'Programme Chair' }), labelsFor('Zoi', roles)), false);
});

test('ce que débloque une tâche terminée', () => {
  const a = analyse([task('AA-001'), task('BB-001', { dependsOn: 'AA-001' }), task('CC-001', { dependsOn: 'AA-001, BB-001' })]);
  assert.deepEqual(wouldUnlock(a, 'AA-001'), ['BB-001']);
});

test('ordre du jour : décisions mûres, retards, attentes', () => {
  const a = analyse([
    task('DD-001', { status: 'Decision needed' }),
    task('DD-002', { status: 'Decision needed', dependsOn: 'DD-001' }),
    task('LL-001', { planningDate: '2026-10-01' }),
    task('WW-001', { status: 'Waiting' }),
  ], { today: '2026-11-16' });
  const ag = agenda(a);
  assert.deepEqual(ag.decisions.map(t => t.id), ['DD-001']);
  assert.deepEqual(ag.overdue.map(t => t.id), ['LL-001']);
  assert.deepEqual(ag.blocked.map(t => t.id), ['WW-001']);
});

test('cellules CSV', () => {
  assert.equal(csvCell('a, "b"'), '"a, ""b"""');
  assert.equal(csvCell('simple'), 'simple');
});
