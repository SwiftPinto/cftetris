import { useState, useEffect, useCallback } from 'react';

interface Score {
  id: number;
  name: string;
  score: number;
  level: number;
  lines: number;
  created_at: string;
}

interface HighScoresProps {
  currentScore: number;
  currentLevel: number;
  currentLines: number;
  gameOver: boolean;
  scoreSaved: boolean;
  onScoreSaved: () => void;
}

export default function HighScores({ currentScore, currentLevel, currentLines, gameOver, scoreSaved, onScoreSaved }: HighScoresProps) {
  const [scores, setScores] = useState<Score[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchScores = useCallback(async () => {
    try {
      const res = await fetch('/api/scores?limit=10');
      if (res.ok) {
        const data = await res.json();
        setScores(data);
      }
    } catch (e) {
      console.error('Failed to fetch scores:', e);
    }
  }, []);

  useEffect(() => {
    fetchScores();
  }, [fetchScores]);

  const submitScore = async () => {
    if (!name.trim() || scoreSaved) return;
    setLoading(true);
    try {
      const res = await fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          score: currentScore,
          level: currentLevel,
          lines: currentLines,
        }),
      });
      if (res.ok) {
        onScoreSaved();
        fetchScores();
      }
    } catch (e) {
      console.error('Failed to submit score:', e);
    }
    setLoading(false);
  };

  return (
    <div className="panel high-scores">
      <h3>TOP SCORES</h3>
      <div className="scores-table-wrapper">
        <table className="scores-table">
          <thead>
            <tr>
              <th>#</th>
              <th>NAME</th>
              <th>SCORE</th>
              <th>LVL</th>
            </tr>
          </thead>
          <tbody>
            {scores.length === 0 && (
              <tr><td colSpan={4} className="empty">No scores yet</td></tr>
            )}
            {scores.map((s, i) => (
              <tr key={s.id} className={s.score === currentScore && scoreSaved ? 'highlight' : ''}>
                <td>{i + 1}</td>
                <td className="name-cell">{s.name}</td>
                <td>{s.score.toLocaleString()}</td>
                <td>{s.level}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {gameOver && currentScore > 0 && !scoreSaved && (
        <div className="submit-score">
          <input
            type="text"
            maxLength={20}
            placeholder="YOUR NAME"
            value={name}
            onChange={e => setName(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && submitScore()}
            autoFocus
          />
          <button onClick={submitScore} disabled={loading || !name.trim()}>
            {loading ? '...' : 'SAVE'}
          </button>
        </div>
      )}
    </div>
  );
}
