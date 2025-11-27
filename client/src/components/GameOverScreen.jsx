export function GameOverScreen({ results, onNewGame, onLeaveRoom }) {
  return (
    <div className="game-over-screen">
      <h1 className="game-title" style={{ fontSize: '3rem' }}>Game Over!</h1>

      <div className="results-table">
        <h2 style={{ color: 'var(--accent-primary)', marginBottom: '20px' }}>
          Final Results
        </h2>

        {results.map((result, index) => (
          <div
            key={result.id}
            className={`result-row ${
              index === 0 && !result.eliminated ? 'winner' : ''
            } ${
              result.eliminated ? 'eliminated' : ''
            }`}
          >
            <div className="rank">
              {result.eliminated ? '💀' : `#${index + 1}`}
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                {result.name}
              </div>
              {result.eliminated && (
                <div style={{ color: 'var(--danger-color)', fontSize: '0.9rem' }}>
                  Eliminated (Poorest Player)
                </div>
              )}
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Status Points
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                {result.score}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                Money Left
              </div>
              <div style={{ fontSize: '1.2rem', color: result.eliminated ? 'var(--danger-color)' : 'var(--text-primary)' }}>
                ${result.money}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && !results[0].eliminated && (
        <div style={{ margin: '30px 0', padding: '20px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '10px' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>
            🏆 {results[0].name} Wins! 🏆
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
            With {results[0].score} status points
          </p>
          {results[0].wonCards.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Winning Collection:
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
                {results[0].wonCards.map((card) => (
                  <div
                    key={card.id}
                    style={{
                      background: 'var(--bg-card)',
                      border: '2px solid var(--accent-primary)',
                      borderRadius: '8px',
                      padding: '10px 15px',
                      fontSize: '0.9rem'
                    }}
                  >
                    {card.name}
                    {card.value && ` (${card.value})`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="button-group">
        <button className="btn btn-primary" onClick={onNewGame}>
          Play Again
        </button>
        <button className="btn btn-secondary" onClick={onLeaveRoom}>
          Leave Room
        </button>
      </div>
    </div>
  );
}
