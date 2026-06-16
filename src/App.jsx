import { useEffect, useMemo, useState } from 'react';
import {
  Brain,
  CheckCircle2,
  Eraser,
  Eye,
  EyeOff,
  Grid3X3,
  ListRestart,
  PartyPopper,
  RotateCcw,
  Rows3,
  Shuffle,
  Sparkles,
  Target,
} from 'lucide-react';

const STORAGE_KEY = 'mathgrid-progress-v1';
const NUMBERS = Array.from({ length: 12 }, (_, index) => index + 1);

const modes = [
  { id: 'grid', label: 'Full Grid', icon: Grid3X3 },
  { id: 'row', label: 'Rows', icon: Rows3 },
  { id: 'random', label: 'Random', icon: Shuffle },
  { id: 'missed', label: 'Missed', icon: Target },
];

const makeFactKey = (a, b) => `${a}x${b}`;

const emptyProgress = {
  gridAnswers: {},
  gridChecked: false,
  rowFamily: 7,
  rowAnswers: {},
  missedFacts: {},
  randomStats: {
    correct: 0,
    incorrect: 0,
    total: 0,
  },
};

const sanitizeNumberInput = (value) => value.replace(/[^\d]/g, '').slice(0, 3);

const loadProgress = () => {
  try {
    const rawProgress = localStorage.getItem(STORAGE_KEY);
    if (!rawProgress) {
      return emptyProgress;
    }

    return {
      ...emptyProgress,
      ...JSON.parse(rawProgress),
    };
  } catch {
    return emptyProgress;
  }
};

const getRandomFact = () => ({
  a: NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
  b: NUMBERS[Math.floor(Math.random() * NUMBERS.length)],
});

function App() {
  const [activeMode, setActiveMode] = useState('grid');
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const missedFacts = useMemo(
    () => Object.values(progress.missedFacts),
    [progress.missedFacts],
  );

  const addMissedFact = (a, b) => {
    const key = makeFactKey(a, b);
    setProgress((current) => {
      const previous = current.missedFacts[key];
      return {
        ...current,
        missedFacts: {
          ...current.missedFacts,
          [key]: {
            key,
            a,
            b,
            misses: (previous?.misses ?? 0) + 1,
            lastMissedAt: Date.now(),
          },
        },
      };
    });
  };

  const removeMissedFact = (key) => {
    setProgress((current) => {
      const nextMissed = { ...current.missedFacts };
      delete nextMissed[key];
      return {
        ...current,
        missedFacts: nextMissed,
      };
    });
  };

  const updateProgress = (updater) => {
    setProgress((current) => ({
      ...current,
      ...updater(current),
    }));
  };

  const ModeComponent = {
    grid: FullGridMode,
    row: RowPracticeMode,
    random: RandomPracticeMode,
    missed: MissedFactsMode,
  }[activeMode];

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Local math practice</p>
          <h1>MathGrid</h1>
        </div>
        <div className="saved-pill" aria-label={`${missedFacts.length} missed facts saved`}>
          <Brain size={18} aria-hidden="true" />
          <span>{missedFacts.length} to practice</span>
        </div>
      </header>

      <nav className="mode-tabs" aria-label="Practice modes">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              className={activeMode === mode.id ? 'mode-tab active' : 'mode-tab'}
              key={mode.id}
              type="button"
              onClick={() => setActiveMode(mode.id)}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </nav>

      <ModeComponent
        addMissedFact={addMissedFact}
        missedFacts={missedFacts}
        progress={progress}
        removeMissedFact={removeMissedFact}
        updateProgress={updateProgress}
      />
    </main>
  );
}

function FullGridMode({ addMissedFact, progress, updateProgress }) {
  const [showAnswers, setShowAnswers] = useState(false);

  const gridFacts = useMemo(
    () =>
      NUMBERS.flatMap((row) =>
        NUMBERS.map((column) => ({
          row,
          column,
          key: makeFactKey(row, column),
          answer: row * column,
        })),
      ),
    [],
  );

  const stats = useMemo(() => {
    const completed = gridFacts.filter((fact) => progress.gridAnswers[fact.key]).length;
    const correct = gridFacts.filter(
      (fact) => Number(progress.gridAnswers[fact.key]) === fact.answer,
    ).length;
    const incorrect = gridFacts.filter((fact) => {
      const value = progress.gridAnswers[fact.key];
      return value && Number(value) !== fact.answer;
    }).length;
    const percent = completed === 0 ? 0 : Math.round((correct / completed) * 100);

    return {
      completed,
      correct,
      incorrect,
      percent,
    };
  }, [gridFacts, progress.gridAnswers]);

  const updateCell = (key, value) => {
    updateProgress((current) => ({
      gridAnswers: {
        ...current.gridAnswers,
        [key]: sanitizeNumberInput(value),
      },
      gridChecked: false,
    }));
  };

  const checkAnswers = () => {
    gridFacts.forEach((fact) => {
      const value = progress.gridAnswers[fact.key];
      if (value && Number(value) !== fact.answer) {
        addMissedFact(fact.row, fact.column);
      }
    });
    updateProgress(() => ({ gridChecked: true }));
  };

  const clearGrid = () => {
    updateProgress(() => ({ gridAnswers: {}, gridChecked: false }));
    setShowAnswers(false);
  };

  return (
    <section className="mode-panel" aria-labelledby="grid-heading">
      <PanelHeader
        icon={Grid3X3}
        title="Full Grid"
        subtitle="Fill the whole 12 by 12 board and check it when you are ready."
      />

      <StatsStrip
        stats={[
          { label: 'Completed', value: `${stats.completed}/144` },
          { label: 'Correct', value: stats.correct },
          { label: 'Score', value: `${stats.percent}%` },
        ]}
      />

      <div className="toolbar">
        <button className="primary-button" type="button" onClick={checkAnswers}>
          <CheckCircle2 size={18} aria-hidden="true" />
          Check Answers
        </button>
        <button className="secondary-button" type="button" onClick={clearGrid}>
          <Eraser size={18} aria-hidden="true" />
          Clear Grid
        </button>
        <label className="toggle-control">
          <input
            checked={showAnswers}
            onChange={(event) => setShowAnswers(event.target.checked)}
            type="checkbox"
          />
          {showAnswers ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
          <span>Show Answers</span>
        </label>
      </div>

      {progress.gridChecked && (
        <div className={stats.incorrect === 0 ? 'feedback-banner success' : 'feedback-banner needs-work'}>
          <strong>
            {stats.incorrect === 0 && stats.completed > 0
              ? 'Great check!'
              : `${stats.incorrect} to practice`}
          </strong>
          <span>
            {stats.incorrect === 0
              ? `${stats.correct} answers are correct.`
              : 'Wrong answers were added to Missed Facts.'}
          </span>
        </div>
      )}

      <div className="grid-scroll">
        <table className="multiplication-grid">
          <thead>
            <tr>
              <th aria-label="times" className="corner-cell">
                x
              </th>
              {NUMBERS.map((number) => (
                <th key={number} scope="col">
                  {number}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {NUMBERS.map((row) => (
              <tr key={row}>
                <th scope="row">{row}</th>
                {NUMBERS.map((column) => {
                  const key = makeFactKey(row, column);
                  const expected = row * column;
                  const value = progress.gridAnswers[key] ?? '';
                  const isCorrect = Number(value) === expected;
                  const wasAnswered = value.length > 0;
                  const statusClass =
                    progress.gridChecked && wasAnswered
                      ? isCorrect
                        ? 'correct'
                        : 'incorrect'
                      : '';

                  return (
                    <td className={statusClass} key={key}>
                      {showAnswers ? (
                        <span className="answer-preview">{expected}</span>
                      ) : (
                        <input
                          aria-label={`${row} times ${column}`}
                          inputMode="numeric"
                          onChange={(event) => updateCell(key, event.target.value)}
                          value={value}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RowPracticeMode({ addMissedFact, progress, updateProgress }) {
  const family = progress.rowFamily;
  const answers = progress.rowAnswers[family] ?? {};
  const rowFacts = NUMBERS.map((number) => ({
    a: family,
    b: number,
    key: makeFactKey(family, number),
    answer: family * number,
  }));

  const checked = answers.__checked === 'yes';
  const correct = rowFacts.filter((fact) => Number(answers[fact.key]) === fact.answer).length;
  const completed = rowFacts.filter((fact) => answers[fact.key]).length;

  const updateAnswer = (key, value) => {
    updateProgress((current) => ({
      rowAnswers: {
        ...current.rowAnswers,
        [family]: {
          ...(current.rowAnswers[family] ?? {}),
          [key]: sanitizeNumberInput(value),
          __checked: 'no',
        },
      },
    }));
  };

  const checkAnswers = () => {
    rowFacts.forEach((fact) => {
      const value = answers[fact.key];
      if (value && Number(value) !== fact.answer) {
        addMissedFact(fact.a, fact.b);
      }
    });

    updateProgress((current) => ({
      rowAnswers: {
        ...current.rowAnswers,
        [family]: {
          ...(current.rowAnswers[family] ?? {}),
          __checked: 'yes',
        },
      },
    }));
  };

  const clearRow = () => {
    updateProgress((current) => {
      const nextAnswers = { ...current.rowAnswers };
      delete nextAnswers[family];
      return {
        rowAnswers: nextAnswers,
      };
    });
  };

  const chooseFamily = (nextFamily) => {
    updateProgress(() => ({ rowFamily: nextFamily }));
  };

  return (
    <section className="mode-panel" aria-labelledby="row-heading">
      <PanelHeader
        icon={Rows3}
        title="Row Practice"
        subtitle="Pick one number family and work through all twelve facts."
      />

      <div className="family-picker" aria-label="Choose a number family">
        {NUMBERS.map((number) => (
          <button
            className={number === family ? 'family-chip active' : 'family-chip'}
            key={number}
            onClick={() => chooseFamily(number)}
            type="button"
          >
            {number}s
          </button>
        ))}
      </div>

      <StatsStrip
        stats={[
          { label: 'Answered', value: `${completed}/12` },
          { label: 'Correct', value: checked ? correct : '-' },
          { label: 'Family', value: `${family}s` },
        ]}
      />

      <div className="question-list">
        {rowFacts.map((fact) => {
          const value = answers[fact.key] ?? '';
          const isCorrect = Number(value) === fact.answer;
          const statusClass =
            checked && value
              ? isCorrect
                ? 'correct'
                : 'incorrect'
              : checked
                ? 'empty'
                : '';

          return (
            <label className={`question-row ${statusClass}`} key={fact.key}>
              <span>
                {fact.a} x {fact.b}
              </span>
              <input
                aria-label={`${fact.a} times ${fact.b}`}
                inputMode="numeric"
                onChange={(event) => updateAnswer(fact.key, event.target.value)}
                value={value}
              />
            </label>
          );
        })}
      </div>

      <div className="toolbar">
        <button className="primary-button" type="button" onClick={checkAnswers}>
          <CheckCircle2 size={18} aria-hidden="true" />
          Check Answers
        </button>
        <button className="secondary-button" type="button" onClick={clearRow}>
          <RotateCcw size={18} aria-hidden="true" />
          Reset Row
        </button>
      </div>
    </section>
  );
}

function RandomPracticeMode({ addMissedFact, progress, updateProgress }) {
  const [fact, setFact] = useState(getRandomFact);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState(null);

  const submitAnswer = (event) => {
    event.preventDefault();
    if (!answer) {
      return;
    }

    const expected = fact.a * fact.b;
    const isCorrect = Number(answer) === expected;

    if (!isCorrect) {
      addMissedFact(fact.a, fact.b);
    }

    updateProgress((current) => ({
      randomStats: {
        correct: current.randomStats.correct + (isCorrect ? 1 : 0),
        incorrect: current.randomStats.incorrect + (isCorrect ? 0 : 1),
        total: current.randomStats.total + 1,
      },
    }));

    setResult({
      isCorrect,
      expected,
    });
  };

  const nextFact = () => {
    setFact(getRandomFact());
    setAnswer('');
    setResult(null);
  };

  const resetStats = () => {
    updateProgress(() => ({
      randomStats: {
        correct: 0,
        incorrect: 0,
        total: 0,
      },
    }));
  };

  return (
    <section className="mode-panel" aria-labelledby="random-heading">
      <PanelHeader
        icon={Shuffle}
        title="Random Practice"
        subtitle="Try one surprise fact at a time and build a streak."
      />

      <StatsStrip
        stats={[
          { label: 'Correct', value: progress.randomStats.correct },
          { label: 'Incorrect', value: progress.randomStats.incorrect },
          { label: 'Attempted', value: progress.randomStats.total },
        ]}
      />

      <form className="random-card" onSubmit={submitAnswer}>
        <div className="big-question" aria-live="polite">
          {fact.a} x {fact.b}
        </div>
        <input
          aria-label={`${fact.a} times ${fact.b}`}
          autoComplete="off"
          className="big-answer"
          inputMode="numeric"
          onChange={(event) => setAnswer(sanitizeNumberInput(event.target.value))}
          value={answer}
        />
        {result && (
          <p className={result.isCorrect ? 'result-message correct-text' : 'result-message incorrect-text'}>
            {result.isCorrect ? 'Correct!' : `Almost. The answer is ${result.expected}.`}
          </p>
        )}
        <div className="toolbar centered">
          {!result ? (
            <button className="primary-button" type="submit">
              <CheckCircle2 size={18} aria-hidden="true" />
              Check
            </button>
          ) : (
            <button className="primary-button" type="button" onClick={nextFact}>
              <Sparkles size={18} aria-hidden="true" />
              Next Fact
            </button>
          )}
          <button className="secondary-button" type="button" onClick={resetStats}>
            <RotateCcw size={18} aria-hidden="true" />
            Reset Score
          </button>
        </div>
      </form>
    </section>
  );
}

function MissedFactsMode({ missedFacts, removeMissedFact }) {
  const [answers, setAnswers] = useState({});
  const [results, setResults] = useState({});

  const sortedFacts = [...missedFacts].sort((a, b) => b.lastMissedAt - a.lastMissedAt);

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({
      ...current,
      [key]: sanitizeNumberInput(value),
    }));
  };

  const retryFact = (fact) => {
    const expected = fact.a * fact.b;
    const isCorrect = Number(answers[fact.key]) === expected;

    setResults((current) => ({
      ...current,
      [fact.key]: isCorrect ? 'correct' : 'incorrect',
    }));

    if (isCorrect) {
      removeMissedFact(fact.key);
      setAnswers((current) => {
        const nextAnswers = { ...current };
        delete nextAnswers[fact.key];
        return nextAnswers;
      });
    }
  };

  return (
    <section className="mode-panel" aria-labelledby="missed-heading">
      <PanelHeader
        icon={Target}
        title="Missed Facts"
        subtitle="Retry saved facts. A correct answer clears the fact from the list."
      />

      {sortedFacts.length === 0 ? (
        <div className="empty-state">
          <PartyPopper size={38} aria-hidden="true" />
          <h2>All caught up!</h2>
          <p>Missed facts from row and random practice will show up here.</p>
        </div>
      ) : (
        <div className="missed-list">
          {sortedFacts.map((fact) => {
            const result = results[fact.key];
            return (
              <div className={`missed-card ${result ?? ''}`} key={fact.key}>
                <div>
                  <span className="fact-label">
                    {fact.a} x {fact.b}
                  </span>
                  <span className="miss-count">Missed {fact.misses}x</span>
                </div>
                <input
                  aria-label={`${fact.a} times ${fact.b}`}
                  inputMode="numeric"
                  onChange={(event) => updateAnswer(fact.key, event.target.value)}
                  value={answers[fact.key] ?? ''}
                />
                <button className="primary-button compact" type="button" onClick={() => retryFact(fact)}>
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Check
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PanelHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="panel-header">
      <div className="panel-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
    </div>
  );
}

function StatsStrip({ stats }) {
  return (
    <div className="stats-strip">
      {stats.map((stat) => (
        <div className="stat-item" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
        </div>
      ))}
    </div>
  );
}

export default App;
