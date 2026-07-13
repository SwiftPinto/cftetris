import { useEffect, useCallback, useState } from 'react';
import { useTetris } from './hooks/useTetris';
import Board from './components/Board';
import NextPiece from './components/NextPiece';
import HoldPiece from './components/HoldPiece';
import ScoreDisplay from './components/ScoreDisplay';
import HighScores from './components/HighScores';
import './App.css';

export default function App() {
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
    ghostY,
  } = useTetris();

  const [scoreSaved, setScoreSaved] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return; // ignore key repeats for instant actions

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
      case 'ArrowLeft':
      case 'a':
      case 'A':
        e.preventDefault();
        moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        e.preventDefault();
        moveRight();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        e.preventDefault();
        softDrop();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
        e.preventDefault();
        rotateCW();
        break;
      case ' ':
        e.preventDefault();
        hardDrop();
        break;
      case 'z':
      case 'Z':
        e.preventDefault();
        rotateCCW();
        break;
      case 'c':
      case 'C':
      case 'Shift':
        e.preventDefault();
        hold();
        break;
      case 'p':
      case 'P':
        e.preventDefault();
        // Pause handled via state
        break;
    }
  }, [state.gameStarted, state.gameOver, startGame, moveLeft, moveRight, softDrop, hardDrop, rotateCW, rotateCCW, hold]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app">
      <header>
        <h1>cf<span className="accent">TETRIS</span></h1>
      </header>
      <div className="game-container">
        <div className="side-panel left-panel">
          <HoldPiece type={state.holdPiece} canHold={state.canHold} />
          <ScoreDisplay score={state.score} level={state.level} lines={state.lines} />
        </div>
        <div className="board-wrapper">
          {!state.gameStarted && !state.gameOver && (
            <div className="start-overlay" onClick={startGame}>
              <div className="start-text">
                <div className="start-title">cfTETRIS</div>
                <div className="start-prompt">Click or press ENTER to start</div>
                <div className="controls-info">
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
            onRestart={() => { setScoreSaved(false); startGame(); }}
          />
        </div>
        <div className="side-panel right-panel">
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
    </div>
  );
}
