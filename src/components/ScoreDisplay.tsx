interface ScoreDisplayProps {
  score: number;
  level: number;
  lines: number;
}

export default function ScoreDisplay({ score, level, lines }: ScoreDisplayProps) {
  return (
    <div className="panel score-panel">
      <div className="score-item">
        <span className="label">SCORE</span>
        <span className="value">{score.toLocaleString()}</span>
      </div>
      <div className="score-item">
        <span className="label">LEVEL</span>
        <span className="value">{level}</span>
      </div>
      <div className="score-item">
        <span className="label">LINES</span>
        <span className="value">{lines}</span>
      </div>
    </div>
  );
}
