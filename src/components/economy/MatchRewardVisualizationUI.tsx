import React, { useEffect, useState } from 'react';

// Match Reward Visualization - Enhanced Graphics Component

interface MatchReward {
  coins: number;
  diamonds: number;
  seasonProgress: number;
  matchResult: 'WIN' | 'DRAW' | 'LOSS';
  difficulty: number;
  cleanPlayBonus: boolean;
}

export const MatchRewardVisualizationUI: React.FC<{ reward: MatchReward }> = ({ reward }) => {
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimationPhase(1), 100);
    return () => clearTimeout(timer);
  }, []);

  const getResultColor = () => {
    switch (reward.matchResult) {
      case 'WIN':
        return { bg: 'rgba(0, 200, 100, 0.2)', border: '#00c864', text: '#00ff88' };
      case 'DRAW':
        return { bg: 'rgba(255, 215, 0, 0.2)', border: '#ffd700', text: '#ffff00' };
      case 'LOSS':
        return { bg: 'rgba(255, 100, 100, 0.2)', border: '#ff6b6b', text: '#ff9999' };
    }
  };

  const resultColor = getResultColor();

  return (
    <div className={`match-reward-container ${animationPhase === 1 ? 'animate-in' : ''}`}>
      <div className="reward-overlay" />

      <div className="reward-card">
        <div className="result-banner" style={{ borderColor: resultColor.border }}>
          <span className="result-text" style={{ color: resultColor.text }}>
            {reward.matchResult === 'WIN'
              ? '🏆 VICTORY'
              : reward.matchResult === 'DRAW'
                ? '⚖️ DRAW'
                : '❌ DEFEAT'}
          </span>
        </div>

        <div className="reward-grid">
          <div className="reward-item coins-item">
            <div className="reward-icon">💰</div>
            <div className="reward-label">Coins</div>
            <div className="reward-amount animated-number">
              +{reward.coins.toLocaleString()}
            </div>
          </div>

          <div className="reward-item diamonds-item">
            <div className="reward-icon">💎</div>
            <div className="reward-label">Diamonds</div>
            <div className="reward-amount animated-number">
              +{reward.diamonds}
            </div>
          </div>

          <div className="reward-item progress-item">
            <div className="reward-icon">📊</div>
            <div className="reward-label">Season Progress</div>
            <div className="reward-amount animated-number">
              +{Math.floor(reward.seasonProgress)} PIS
            </div>
          </div>
        </div>

        <div className="reward-details">
          <div className="detail-row">
            <span>Difficulty:</span>
            <span className="detail-value">{(reward.difficulty * 100).toFixed(0)}%</span>
          </div>

          {reward.cleanPlayBonus && (
            <div className="detail-row bonus">
              <span>✅ Clean Play Bonus</span>
              <span className="detail-value">+10%</span>
            </div>
          )}
        </div>

        <div className="reward-footer">
          <p className="footer-text">Rewards will be synced when online</p>
        </div>
      </div>

      <style>{`
        .match-reward-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: all;
        }

        .reward-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          animation: fade-in 0.4s ease;
        }

        .reward-card {
          position: relative;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          padding: 32px;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
          border: 2px solid #0f3460;
          animation: slide-up 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .result-banner {
          text-align: center;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 2px solid;
          background: rgba(0, 0, 0, 0.3);
        }

        .result-text {
          font-size: 28px;
          font-weight: bold;
          text-shadow: 0 0 10px currentColor;
        }

        .reward-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        .reward-item {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          border: 1px solid #2a4a6a;
          transition: all 0.3s ease;
        }

        .reward-item:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
        }

        .coins-item {
          border-color: #ffd700;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 170, 0, 0.05) 100%);
        }

        .diamonds-item {
          border-color: #87ceeb;
          background: linear-gradient(135deg, rgba(135, 206, 235, 0.1) 0%, rgba(0, 191, 255, 0.05) 100%);
        }

        .progress-item {
          border-color: #ff6b9d;
          background: linear-gradient(135deg, rgba(255, 107, 157, 0.1) 0%, rgba(255, 105, 180, 0.05) 100%);
        }

        .reward-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .reward-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .reward-amount {
          font-size: 20px;
          font-weight: bold;
          color: #fff;
        }

        .animated-number {
          animation: pop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .reward-details {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          border-left: 3px solid #0f3460;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #ccc;
          margin-bottom: 6px;
        }

        .detail-row.bonus {
          color: #00ff88;
          font-weight: bold;
        }

        .detail-value {
          color: #ffd700;
          font-weight: bold;
        }

        .reward-footer {
          text-align: center;
          border-top: 1px solid #2a4a6a;
          padding-top: 16px;
        }

        .footer-text {
          font-size: 11px;
          color: #666;
          margin: 0;
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            transform: translateY(40px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes pop-in {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
