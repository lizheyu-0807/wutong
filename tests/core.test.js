import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPatient,
  createReminderQueue,
  createStorageAdapter,
  exportPatientsCsv,
  filterPatients,
  getNextActionNode,
  getPatientTimeline,
  getStatistics,
  seedDemoState,
} from '../core.js';

test('generates the required morning home-prep timeline from configurable rules', () => {
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });
  const patient = createPatient(state, {
    examDate: '2026-06-03',
    examPeriod: 'morning',
    painless: true,
    name: '张三',
    phone: '13800000000',
    histories: ['hypertension'],
  });

  const homeNodes = getPatientTimeline(state, patient.id, 'home');

  assert.deepEqual(
    homeNodes.map((node) => [node.id, node.scheduledAt]),
    [
      ['home-laxative-1', '2026-06-02T20:00:00+08:00'],
      ['home-fasting-am', '2026-06-03T02:00:00+08:00'],
      ['home-laxative-2-am', '2026-06-03T04:00:00+08:00'],
      ['home-arrive', '2026-06-03T07:30:00+08:00'],
    ],
  );
  assert.equal(patient.currentPhase, 'home');
});

test('generates afternoon prep and reminder queue one hour before node execution', () => {
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });
  const patient = createPatient(state, {
    examDate: '2026-06-04',
    examPeriod: 'afternoon',
    painless: false,
    name: '李四',
    phone: '13900000000',
    histories: [],
  });

  const homeNodes = getPatientTimeline(state, patient.id, 'home');
  const reminders = createReminderQueue(state, patient.id);

  assert.equal(homeNodes.find((node) => node.id === 'home-laxative-2-pm').scheduledAt, '2026-06-04T08:00:00+08:00');
  assert.equal(homeNodes.find((node) => node.id === 'home-fasting-pm').scheduledAt, '2026-06-04T07:00:00+08:00');
  assert.equal(reminders.find((item) => item.nodeId === 'home-laxative-2-pm').sendAt, '2026-06-04T07:00:00+08:00');
  assert.match(reminders[0].message, /内镜中心提醒/);
});

test('filters patients by date, progress node, name, and phone', () => {
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });
  const patient = createPatient(state, {
    examDate: '2026-06-03',
    examPeriod: 'morning',
    painless: true,
    name: '王小明',
    phone: '13711112222',
    histories: [],
  });
  patient.completedNodeIds = ['home-laxative-1', 'home-laxative-2-am'];

  const results = filterPatients(state, {
    examDate: '2026-06-03',
    progressNodeId: 'home-fasting-am',
    query: '2222',
  });

  assert.equal(results.length, 1);
  assert.equal(results[0].name, '王小明');
});

test('computes statistics and exports csv rows', () => {
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });
  const patient = createPatient(state, {
    examDate: '2026-06-05',
    examPeriod: 'afternoon',
    painless: true,
    name: '赵六',
    phone: '13600001111',
    histories: ['diabetes'],
  });
  patient.completedNodeIds = ['home-laxative-1', 'home-laxative-2-pm', 'home-fasting-pm'];

  const stats = getStatistics(state);
  const csv = exportPatientsCsv(state, [patient]);

  assert.equal(stats.totalPatients, 1);
  assert.equal(stats.monthlyCounts['2026-06'], 1);
  assert.equal(stats.nodeCompletion['home-laxative-1'].completed, 1);
  assert.match(csv, /姓名,检查日期,检查时段,联系电话,是否无痛,基础病史,当前进度节点/);
  assert.match(csv, /赵六,2026-06-05,下午,13600001111/);
});

test('identifies the next incomplete action from current timeline', () => {
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });
  const patient = createPatient(state, {
    examDate: '2026-06-03',
    examPeriod: 'morning',
    painless: true,
    name: '孙七',
    phone: '13500001111',
    histories: [],
  });
  patient.completedNodeIds = ['home-laxative-1'];

  const nextNode = getNextActionNode(state, patient.id);

  assert.equal(nextNode.id, 'home-fasting-am');
});

test('storage adapter wraps persisted data instead of plain json', () => {
  const calls = new Map();
  const storage = {
    getItem(key) {
      return calls.get(key) ?? null;
    },
    setItem(key, value) {
      calls.set(key, value);
    },
  };
  const adapter = createStorageAdapter(storage, 'demo');
  const state = seedDemoState({ now: '2026-06-01T09:00:00+08:00' });

  adapter.save(state);
  const raw = calls.get('demo');
  const loaded = adapter.load();

  assert.doesNotMatch(raw, /patients/);
  assert.deepEqual(loaded.config.hospitalName, state.config.hospitalName);
});
