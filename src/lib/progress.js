import { makeFactKey } from './mathFacts.js';

export const STORAGE_KEY = 'mathgrid-progress-v1';

export const emptyProgress = {
  gridAnswers: {},
  gridChecked: false,
  rowFamily: 7,
  rowAnswers: {},
  missedFacts: {},
  randomStats: {
    correct: 0,
    incorrect: 0,
    total: 0,
    currentStreak: 0,
    bestStreak: 0,
  },
};

export const mergeProgress = (savedProgress) => ({
  ...emptyProgress,
  ...savedProgress,
  gridAnswers: savedProgress?.gridAnswers ?? emptyProgress.gridAnswers,
  rowAnswers: savedProgress?.rowAnswers ?? emptyProgress.rowAnswers,
  missedFacts: savedProgress?.missedFacts ?? emptyProgress.missedFacts,
  randomStats: {
    ...emptyProgress.randomStats,
    ...(savedProgress?.randomStats ?? {}),
  },
});

export const addMissedFactToProgress = (progress, a, b, now = Date.now()) => {
  const key = makeFactKey(a, b);
  const previous = progress.missedFacts[key];

  return {
    ...progress,
    missedFacts: {
      ...progress.missedFacts,
      [key]: {
        key,
        a,
        b,
        misses: (previous?.misses ?? 0) + 1,
        lastMissedAt: now,
      },
    },
  };
};

export const removeMissedFactFromProgress = (progress, key) => {
  const nextMissed = { ...progress.missedFacts };
  delete nextMissed[key];

  return {
    ...progress,
    missedFacts: nextMissed,
  };
};
