import { useEffect, useCallback, useState } from 'react';
import { useTetris } from './hooks/useTetris';
import Board from './components/Board';
import NextPiece from './components/NextPiece';
import HoldPiece from './components/HoldPiece';
import ScoreDisplay from './components/ScoreDisplay';
import HighScores from './components/HighScores';
import PasswordGate from './components/PasswordGate';
import TouchControls from './components/TouchControls';
import './App.css';

export default function App() {
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const hasAuth = document.cookie.split(';').some(c => c.trim().startsWith('cf_tetris_auth='));
    if (hasAuth) setAuthenticated(true);
  }, []);

  if (!authenticated) {
    return <PasswordGate onUnlock={() => setAuthenticated(true)} />;
  }

  return <Game />;
}

function Game() {
  const {
    state,
    startGame,
    moveLeft,
    moveRight,
    softDrop,
    hardDrop,
    rotateCW,
    rotateCCW,
    hold,
    togglePause,
    ghostY,
  } = useTetris();

  const [scoreSaved, setScoreSaved] = useState(false);
  const [showScores, setShowScores] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;

    if (!state.gameStarted && !state.gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        startGame();
      }
      return;
    }

    if (state.gameOver) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setScoreSaved(false);
        startGame();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowLeft': case 'a': case 'A':
        e.preventDefault(); moveLeft(); break;
      case 'ArrowRight': case 'd': case 'D':
        e.preventDefault(); moveRight(); break;
      case 'ArrowDown': case 's': case 'S':
        e.preventDefault(); softDrop(); break;
      case 'ArrowUp': case 'w': case 'W':
        e.preventDefault(); rotateCW(); break;
      case ' ':
        e.preventDefault(); hardDrop(); break;
      case 'z': case 'Z':
        e.preventDefault(); rotateCCW(); break;
      case 'c': case 'C': case 'Shift':
        e.preventDefault(); hold(); break;
      case 'p': case 'P':
        e.preventDefault(); togglePause(); break;
    }
  }, [state.gameStarted, state.gameOver, startGame, moveLeft, moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold, togglePause]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app">
      <header className="desktop-only">
        <h1>cf<span className="accent">TETRIS</span></h1>
      </header>

      <div className="game-container">
        {/* Mobile top bar — shown by CSS media query */}
        <div className="mobile-top-bar">
          <HoldPiece type={state.holdPiece} canHold={state.canHold} />
          <ScoreDisplay score={state.score} level={state.level} lines={state.lines} />
          <NextPiece piece={state.nextPiece} />
        </div>

        {/* Desktop left panel — hidden by CSS on mobile */}
        <div className="side-panel left-panel desktop-only-flex">
          <HoldPiece type={state.holdPiece} canHold={state.canHold} />
          <ScoreDisplay score={state.score} level={state.level} lines={state.lines} />
        </div>

        <div className="board-wrapper">
          {!state.gameStarted && !state.gameOver && (
            <div className="start-overlay" onClick={startGame}>
              <div className="start-text">
                <div className="start-title">cfTETRIS</div>
                <div className="start-prompt desktop-only">
                  Click or press ENTER to start
                </div>
                <div className="start-prompt mobile-only">
                  Tap to start
                </div>
                <div className="controls-info desktop-only">
                  <div><kbd>← →</kbd> Move</div>
                  <div><kbd>↓</kbd> Soft Drop</div>
                  <div><kbd>↑</kbd> / <kbd>W</kbd> Rotate CW</div>
                  <div><kbd>Z</kbd> Rotate CCW</div>
                  <div><kbd>Space</kbd> Hard Drop</div>
                  <div><kbd>C</kbd> / <kbd>Shift</kbd> Hold</div>
                </div>
              </div>
            </div>
          )}
          <Board
            board={state.board}
            currentPiece={state.currentPiece}
            ghostY={ghostY}
            gameOver={state.gameOver && !scoreSaved}
            paused={state.paused && !state.gameOver}
            onRestart={() => { setScoreSaved(false); startGame(); }}
          />
        </div>

        {/* Desktop right panel — hidden by CSS on mobile */}
        <div className="side-panel right-panel desktop-only-flex">
          <NextPiece piece={state.nextPiece} />
          <HighScores
            currentScore={state.score}
            currentLevel={state.level}
            currentLines={state.lines}
            gameOver={state.gameOver}
            onScoreSaved={() => setScoreSaved(true)}
          />
        </div>
      </div>

      {/* Touch controls — always rendered, CSS hides on desktop */}
      <TouchControls
        onLeft={moveLeft}
        onRight={moveRight}
        onSoftDrop={softDrop}
        onHardDrop={hardDrop}
        onRotateCW={rotateCW}
        onRotateCCW={rotateCCW}
        onHold={hold}
        visible={true}
      />

      {/* Mobile scores toggle — shown by CSS media query */}
      <div className="mobile-scores-section">
        <button
          className="scores-toggle"
          onClick={() => setShowScores(!showScores)}
        >
          {showScores ? '▼ HIDE SCORES' : '▲ TOP SCORES'}
        </button>
        {showScores && (
          <div className="mobile-scores">
            <HighScores
              currentScore={state.score}
              currentLevel={state.level}
              currentLines={state.lines}
              gameOver={state.gameOver}
              onScoreSaved={() => setScoreSaved(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
