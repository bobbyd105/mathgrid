export const MAX_FACTOR = 12;
export const NUMBERS = Array.from({ length: MAX_FACTOR }, (_, index) => index + 1);

export const makeFactKey = (a, b) => `${a}x${b}`;

export const sanitizeNumberInput = (value) => value.replace(/[^\d]/g, '').slice(0, 3);

export const isAnswered = (value) => value !== undefined && value !== null && String(value).length > 0;

export const isCorrectAnswer = (answer, expected) => isAnswered(answer) && Number(answer) === expected;

export const createFacts = (leftNumbers = NUMBERS, rightNumbers = NUMBERS) =>
  leftNumbers.flatMap((a) =>
    rightNumbers.map((b) => ({
      a,
      b,
      row: a,
      column: b,
      key: makeFactKey(a, b),
      answer: a * b,
    })),
  );

export const createRowFacts = (family) => createFacts([family], NUMBERS);

export const calculateGridStats = (answers, facts = createFacts()) => {
  const completed = facts.filter((fact) => isAnswered(answers[fact.key])).length;
  const correct = facts.filter((fact) => isCorrectAnswer(answers[fact.key], fact.answer)).length;
  const incorrect = facts.filter((fact) => {
    const value = answers[fact.key];
    return isAnswered(value) && !isCorrectAnswer(value, fact.answer);
  }).length;
  const percent = completed === 0 ? 0 : Math.round((correct / completed) * 100);

  return {
    completed,
    correct,
    incorrect,
    percent,
  };
};

export const findMissedAnsweredFacts = (answers, facts) =>
  facts.filter((fact) => {
    const value = answers[fact.key];
    return isAnswered(value) && !isCorrectAnswer(value, fact.answer);
  });

export const getRandomFact = ({ avoidKey, numbers = NUMBERS, rng = Math.random } = {}) => {
  const candidates = createFacts(numbers, numbers).filter((fact) => fact.key !== avoidKey);
  const pool = candidates.length > 0 ? candidates : createFacts(numbers, numbers);
  const index = Math.floor(rng() * pool.length);
  const fact = pool[Math.min(index, pool.length - 1)];

  return {
    a: fact.a,
    b: fact.b,
  };
};
