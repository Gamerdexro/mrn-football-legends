import React from 'react';

// Economy Dashboard - Enhanced Graphics for Economy Status

interface EconomyStats {
  playerCoins: number;
  playerDiamonds: number;
  averageCoinsPerPlayer: number;
  averageDiamondsPerPlayer: number;
  inflationRating: string; // LOW, STABLE, HIGH
  marketHealth: number; // 0-1
  farmingMultiplier: number;
  currentPhase: string;
}

export const EconomyDashboardUI: React.FC<{ stats: EconomyStats }> = ({ stats }) => {
  const getInflationColor = (rating: string) => {
    switch (rating) {
      case 'LOW':
        return '#00c864';
      case 'STABLE':
        return '#ffd700';
      case 'HIGH':
        return '#ff6b6b';
      default:
        return '#87ceeb';
    }
  };

  const getMarketHealthStatus = (health: number) => {
    if (health > 0.8) return { label: 'BOOMING', color: '#00c864' };
    if (health > 0.6) return { label: 'HEALTHY', color: '#87ceeb' };
    if (health > 0.4) return { label: 'VOLATILE', color: '#ffd700' };
    return { label: 'CRITICAL', color: '#ff6b6b' };
  };

  const marketStatus = getMarketHealthStatus(stats.marketHealth);

  return (
    <div className="economy-dashboard">
      <div className="dashboard-title">📊 Economy Status</div>

      <div className="currency-section">
        <div className="currency-card coins">
          <div className="currency-icon">💰</div>
          <div className="currency-label">Coins</div>
          <div className="currency-amount">{stats.playerCoins.toLocaleString()}</div>
          <div className="currency-avg">Avg: {stats.averageCoinsPerPlayer.toLocaleString()}</div>
        </div>

        <div className="currency-card diamonds">
          <div className="currency-icon">💎</div>
          <div className="currency-label">Diamonds</div>
          <div className="currency-amount">{stats.playerDiamonds}</div>
          <div className="currency-avg">Avg: {stats.averageDiamondsPerPlayer}</div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">📈 Inflation</div>
          <div
            className="metric-value"
            style={{ color: getInflationColor(stats.inflationRating) }}
          >
            {stats.inflationRating}
          </div>
          <div className="metric-description">Economic balance</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">🏛️ Market Health</div>
          <div className="health-bar">
            <div
              className="health-fill"
              style={{
                width: `${stats.marketHealth * 100}%`,
                backgroundColor: marketStatus.color,
              }}
            />
          </div>
          <div className="metric-value" style={{ color: marketStatus.color }}>
            {marketStatus.label}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">🎮 Farm Multiplier</div>
          <div className="metric-value">
            {stats.farmingMultiplier.toFixed(2)}x
          </div>
          <div className="metric-description">
            {stats.farmingMultiplier < 0.8
              ? '⚠️ Suspicious activity detected'
              : '✅ Normal gameplay'}
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-label">🗓️ Economy Phase</div>
          <div className="metric-value">{stats.currentPhase}</div>
          <div className="phase-description">
            {stats.currentPhase === 'PHASE_1' && 'Resources tight, experimenting'}
            {stats.currentPhase === 'PHASE_2' && 'Forge activity rising'}
            {stats.currentPhase === 'PHASE_3' && 'Skill gaps visible'}
            {stats.currentPhase === 'PHASE_4' && 'Meta stabilizing'}
            {stats.currentPhase === 'PHASE_5' && 'Cosmetics matter'}
            {stats.currentPhase === 'PHASE_6' && 'Sustainable ecosystem'}
          </div>
        </div>
      </div>

      <style>{`
        .economy-dashboard {
          background: linear-gradient(135deg, #0f1620 0%, #1a2332 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          border: 2px solid #2a4a6a;
        }

        .dashboard-title {
          font-size: 20px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 20px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .currency-section {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }

        .currency-card {
          flex: 1;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
          padding: 16px;
          text-align: center;
          border: 2px solid;
          transition: all 0.3s ease;
        }

        .currency-card.coins {
          border-color: #ffd700;
          background: linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 170, 0, 0.05) 100%);
        }

        .currency-card.coins:hover {
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
          transform: translateY(-2px);
        }

        .currency-card.diamonds {
          border-color: #87ceeb;
          background: linear-gradient(135deg, rgba(135, 206, 235, 0.1) 0%, rgba(0, 191, 255, 0.05) 100%);
        }

        .currency-card.diamonds:hover {
          box-shadow: 0 0 20px rgba(135, 206, 235, 0.3);
          transform: translateY(-2px);
        }

        .currency-icon {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .currency-label {
          font-size: 14px;
          color: #999;
          margin-bottom: 8px;
        }

        .currency-amount {
          font-size: 24px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .currency-avg {
          font-size: 11px;
          color: #666;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
        }

        .metric-card {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid #2a4a6a;
          border-radius: 8px;
          padding: 12px;
        }

        .metric-label {
          font-size: 12px;
          color: #999;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          margin-bottom: 4px;
        }

        .metric-description {
          font-size: 11px;
          color: #666;
        }

        .health-bar {
          width: 100%;
          height: 8px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 4px;
          margin: 8px 0;
          overflow: hidden;
        }

        .health-fill {
          height: 100%;
          border-radius: 4px;
          transition: width 0.3s ease;
        }

        .phase-description {
          font-size: 10px;
          color: #aaa;
          margin-top: 6px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};
