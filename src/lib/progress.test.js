import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addMissedFactToProgress,
  emptyProgress,
  mergeProgress,
  removeMissedFactFromProgress,
} from './progress.js';

test('saves missed facts and increments repeat misses', () => {
  const firstMiss = addMissedFactToProgress(emptyProgress, 7, 8, 100);
  const secondMiss = addMissedFactToProgress(firstMiss, 7, 8, 200);

  assert.deepEqual(secondMiss.missedFacts['7x8'], {
    key: '7x8',
    a: 7,
    b: 8,
    misses: 2,
    lastMissedAt: 200,
  });
});

test('removes a missed fact after correct retry', () => {
  const withMiss = addMissedFactToProgress(emptyProgress, 9, 6, 300);
  const cleared = removeMissedFactFromProgress(withMiss, '9x6');

  assert.equal(cleared.missedFacts['9x6'], undefined);
  assert.notEqual(withMiss.missedFacts['9x6'], undefined);
});

test('merges saved local progress with new random streak defaults', () => {
  const merged = mergeProgress({
    randomStats: {
      correct: 2,
      incorrect: 1,
      total: 3,
    },
  });

  assert.deepEqual(merged.randomStats, {
    correct: 2,
    incorrect: 1,
    total: 3,
    currentStreak: 0,
    bestStreak: 0,
  });
});
