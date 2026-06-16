import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  calculateGridStats,
  findMissedAnsweredFacts,
  getRandomFact,
  isCorrectAnswer,
  makeFactKey,
} from './mathFacts.js';

test('checks multiplication answers', () => {
  assert.equal(isCorrectAnswer('42', 42), true);
  assert.equal(isCorrectAnswer('41', 42), false);
  assert.equal(isCorrectAnswer('', 42), false);
});

test('scores completed, correct, incorrect, and percent for grid answers', () => {
  const facts = [
    { key: makeFactKey(2, 3), answer: 6 },
    { key: makeFactKey(4, 5), answer: 20 },
    { key: makeFactKey(6, 7), answer: 42 },
  ];
  const stats = calculateGridStats(
    {
      [makeFactKey(2, 3)]: '6',
      [makeFactKey(4, 5)]: '21',
      [makeFactKey(6, 7)]: '',
    },
    facts,
  );

  assert.deepEqual(stats, {
    completed: 2,
    correct: 1,
    incorrect: 1,
    percent: 50,
  });
});

test('finds only answered missed facts', () => {
  const facts = [
    { a: 3, b: 4, key: makeFactKey(3, 4), answer: 12 },
    { a: 3, b: 5, key: makeFactKey(3, 5), answer: 15 },
    { a: 3, b: 6, key: makeFactKey(3, 6), answer: 18 },
  ];

  assert.deepEqual(
    findMissedAnsweredFacts(
      {
        [makeFactKey(3, 4)]: '12',
        [makeFactKey(3, 5)]: '14',
        [makeFactKey(3, 6)]: '',
      },
      facts,
    ).map((fact) => fact.key),
    [makeFactKey(3, 5)],
  );
});

test('generates a random fact that avoids an immediate repeat when possible', () => {
  const fact = getRandomFact({
    avoidKey: makeFactKey(1, 1),
    numbers: [1, 2],
    rng: () => 0,
  });

  assert.notEqual(makeFactKey(fact.a, fact.b), makeFactKey(1, 1));
});

test('falls back when every possible random fact is the avoided fact', () => {
  const fact = getRandomFact({
    avoidKey: makeFactKey(1, 1),
    numbers: [1],
    rng: () => 0,
  });

  assert.deepEqual(fact, { a: 1, b: 1 });
});
