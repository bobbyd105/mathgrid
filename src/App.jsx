import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Eraser,
  Eye,
  EyeOff,
  Grid3X3,
  PartyPopper,
  RotateCcw,
  Rows3,
  Shuffle,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  calculateGridStats,
  createFacts,
  createRowFacts,
  findMissedAnsweredFacts,
  getRandomFact,
  isCorrectAnswer,
  makeFactKey,
  NUMBERS,
  sanitizeNumberInput,
} from './lib/mathFacts.js';
import {
  addMissedFactToProgress,
  emptyProgress,
  mergeProgress,
  removeMissedFactFromProgress,
  STORAGE_KEY,
} from './lib/progress.js';

const modes = [
  { id: 'grid', label: 'Full Grid', icon: Grid3X3 },
  { id: 'row', label: 'Rows', icon: Rows3 },
  { id: 'random', label: 'Random', icon: Shuffle },
  { id: 'missed', label: 'Missed', icon: Target },
];

const loadProgress = () => {
  try {
    const rawProgress = localStorage.getItem(STORAGE_KEY);
    if (!rawProgress) {
      return emptyProgress;
    }

    return mergeProgress(JSON.parse(rawProgress));
  } catch {
    return emptyProgress;
  }
};

function App() {
  const [activeMode, setActiveMode] = useState('grid');
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Progress is best-effort in local storage; practice should keep working.
    }
  }, [progress]);

  const missedFacts = useMemo(
    () => Object.values(progress.missedFacts),
    [progress.missedFacts],
  );

  const addMissedFact = (a, b) => {
    setProgress((current) => addMissedFactToProgress(current, a, b));
  };

  const removeMissedFact = (key) => {
    setProgress((current) => removeMissedFactFromProgress(current, key));
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
              aria-current={activeMode === mode.id ? 'page' : undefined}
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

  const gridFacts = useMemo(() => createFacts(), []);

  const stats = useMemo(() => {
    return calculateGridStats(progress.gridAnswers, gridFacts);
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
    findMissedAnsweredFacts(progress.gridAnswers, gridFacts).forEach((fact) =>
      addMissedFact(fact.a, fact.b),
    );
    updateProgress(() => ({ gridChecked: true }));
  };

  const clearGrid = () => {
    updateProgress(() => ({ gridAnswers: {}, gridChecked: false }));
    setShowAnswers(false);
  };

  return (
    <section className="mode-panel" aria-labelledby="grid-heading">
      <PanelHeader
        headingId="grid-heading"
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
        <button
          className="primary-button"
          disabled={stats.completed === 0}
          type="button"
          onClick={checkAnswers}
        >
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
        <div
          className={stats.incorrect === 0 ? 'feedback-banner success' : 'feedback-banner needs-work'}
          role="status"
        >
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
  const rowFacts = createRowFacts(family);

  const checked = answers.__checked === 'yes';
  const correct = rowFacts.filter((fact) => isCorrectAnswer(answers[fact.key], fact.answer)).length;
  const completed = rowFacts.filter((fact) => answers[fact.key]).length;
  const isPerfect = checked && correct === rowFacts.length;

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
    findMissedAnsweredFacts(answers, rowFacts).forEach((fact) => addMissedFact(fact.a, fact.b));

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

  const nextFamily = () => {
    chooseFamily(family === 12 ? 1 : family + 1);
  };

  return (
    <section className="mode-panel" aria-labelledby="row-heading">
      <PanelHeader
        headingId="row-heading"
        icon={Rows3}
        title="Row Practice"
        subtitle="Pick one number family and work through all twelve facts."
      />

      <div className="family-picker" aria-label="Choose a number family">
        {NUMBERS.map((number) => (
          <button
            className={number === family ? 'family-chip active' : 'family-chip'}
            aria-pressed={number === family}
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

      {checked && (
        <div className={isPerfect ? 'feedback-banner success' : 'feedback-banner needs-work'} role="status">
          <strong>{isPerfect ? 'Row mastered!' : `${12 - correct} to review`}</strong>
          <span>
            {isPerfect
              ? `Every ${family}s fact is correct.`
              : 'Wrong attempted answers were saved to Missed Facts.'}
          </span>
        </div>
      )}

      <div className="question-list">
        {rowFacts.map((fact) => {
          const value = answers[fact.key] ?? '';
          const isCorrect = isCorrectAnswer(value, fact.answer);
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
              {checked && value && !isCorrect && (
                <small className="answer-hint">Answer: {fact.answer}</small>
              )}
            </label>
          );
        })}
      </div>

      <div className="toolbar">
        <button
          className="primary-button"
          disabled={completed === 0}
          type="button"
          onClick={checkAnswers}
        >
          <CheckCircle2 size={18} aria-hidden="true" />
          Check Answers
        </button>
        <button className="secondary-button" type="button" onClick={clearRow}>
          <RotateCcw size={18} aria-hidden="true" />
          Reset Row
        </button>
        {isPerfect && (
          <button className="secondary-button" type="button" onClick={nextFamily}>
            <ArrowRight size={18} aria-hidden="true" />
            Next Family
          </button>
        )}
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
      randomStats: (() => {
        const nextStreak = isCorrect ? (current.randomStats.currentStreak ?? 0) + 1 : 0;
        return {
          correct: current.randomStats.correct + (isCorrect ? 1 : 0),
          incorrect: current.randomStats.incorrect + (isCorrect ? 0 : 1),
          total: current.randomStats.total + 1,
          currentStreak: nextStreak,
          bestStreak: Math.max(current.randomStats.bestStreak ?? 0, nextStreak),
        };
      })(),
    }));

    setResult({
      isCorrect,
      expected,
      nextStreak: isCorrect ? (progress.randomStats.currentStreak ?? 0) + 1 : 0,
    });
  };

  const nextFact = () => {
    setFact(getRandomFact({ avoidKey: makeFactKey(fact.a, fact.b) }));
    setAnswer('');
    setResult(null);
  };

  const resetStats = () => {
    updateProgress(() => ({
      randomStats: {
        correct: 0,
        incorrect: 0,
        total: 0,
        currentStreak: 0,
        bestStreak: 0,
      },
    }));
  };

  return (
    <section className="mode-panel" aria-labelledby="random-heading">
      <PanelHeader
        headingId="random-heading"
        icon={Shuffle}
        title="Random Practice"
        subtitle="Try one surprise fact at a time and build a streak."
      />

      <StatsStrip
        stats={[
          { label: 'Correct', value: progress.randomStats.correct },
          { label: 'Incorrect', value: progress.randomStats.incorrect },
          { label: 'Attempted', value: progress.randomStats.total },
          { label: 'Streak', value: progress.randomStats.currentStreak },
          { label: 'Best', value: progress.randomStats.bestStreak },
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
            {result.isCorrect ? `Correct! Streak: ${result.nextStreak}` : `Almost. The answer is ${result.expected}.`}
          </p>
        )}
        <div className="toolbar centered">
          {!result ? (
            <button className="primary-button" disabled={!answer} type="submit">
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
  const [clearedFact, setClearedFact] = useState('');

  const sortedFacts = [...missedFacts].sort((a, b) => b.lastMissedAt - a.lastMissedAt);

  const updateAnswer = (key, value) => {
    setAnswers((current) => ({
      ...current,
      [key]: sanitizeNumberInput(value),
    }));
    setResults((current) => ({
      ...current,
      [key]: undefined,
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
      setClearedFact(`${fact.a} x ${fact.b}`);
      removeMissedFact(fact.key);
      setAnswers((current) => {
        const nextAnswers = { ...current };
        delete nextAnswers[fact.key];
        return nextAnswers;
      });
    } else {
      setClearedFact('');
    }
  };

  return (
    <section className="mode-panel" aria-labelledby="missed-heading">
      <PanelHeader
        headingId="missed-heading"
        icon={Target}
        title="Missed Facts"
        subtitle="Retry saved facts. A correct answer clears the fact from the list."
      />

      {clearedFact && (
        <div className="feedback-banner success" role="status">
          <strong>Fact cleared!</strong>
          <span>{clearedFact} moved out of Missed Facts.</span>
        </div>
      )}

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
                <button
                  className="primary-button compact"
                  disabled={!answers[fact.key]}
                  type="button"
                  onClick={() => retryFact(fact)}
                >
                  <CheckCircle2 size={18} aria-hidden="true" />
                  Check
                </button>
                {result === 'incorrect' && (
                  <small className="answer-hint">Answer: {fact.a * fact.b}</small>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PanelHeader({ headingId, icon: Icon, title, subtitle }) {
  return (
    <div className="panel-header">
      <div className="panel-icon">
        <Icon size={24} aria-hidden="true" />
      </div>
      <div>
        <h2 id={headingId}>{title}</h2>
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
