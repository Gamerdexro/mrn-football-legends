import React, { useState, useEffect } from 'react';

// Season Reward Ladder - Enhanced Graphics Component

interface MilestoneReward {
  id: number;
  progress: number;
  coinsReward: number;
  diamondsReward: number;
  cosmetics?: string[];
  locked: boolean;
}

export const SeasonRewardLadderUI: React.FC<{
  currentMilestone: number;
  progress: number;
  milestones: MilestoneReward[];
  seasonEndDate: Date;
}> = ({ currentMilestone, progress, milestones, seasonEndDate }) => {
  const daysRemaining = Math.ceil(
    (seasonEndDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)
  );

  return (
    <div className="season-reward-ladder">
      <div className="season-header">
        <h2>🏆 Season Progress</h2>
        <div className="season-timer">
          <span className="timer-icon">⏱️</span>
          {daysRemaining} days remaining
        </div>
      </div>

      <div className="milestone-container">
        {milestones.map((milestone, idx) => (
          <div
            key={milestone.id}
            className={`milestone ${idx < currentMilestone ? 'completed' : idx === currentMilestone - 1 ? 'active' : 'locked'}`}
          >
            <div className="milestone-number">{milestone.id}</div>
            <div className="milestone-rewards">
              <div className="coin-reward">
                💰 {milestone.coinsReward}
              </div>
              <div className="diamond-reward">
                💎 {milestone.diamondsReward}
              </div>
            </div>

            {idx === currentMilestone - 1 && (
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress * 100}%` }}
                />
                <span className="progress-text">{Math.floor(progress * 100)}%</span>
              </div>
            )}

            {milestone.cosmetics && milestone.cosmetics.length > 0 && (
              <div className="cosmetics-badge">✨ {milestone.cosmetics.length} items</div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .season-reward-ladder {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          border: 2px solid #0f3460;
        }

        .season-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #0f3460;
          padding-bottom: 10px;
        }

        .season-header h2 {
          color: #ffd700;
          font-size: 24px;
          margin: 0;
        }

        .season-timer {
          background: rgba(255, 215, 0, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          color: #ffd700;
          font-weight: bold;
        }

        .milestone-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
          gap: 12px;
        }

        .milestone {
          background: rgba(15, 52, 96, 0.5);
          border: 2px solid #0f3460;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          transition: all 0.3s ease;
          position: relative;
        }

        .milestone.completed {
          background: rgba(0, 200, 100, 0.2);
          border-color: #00c864;
          box-shadow: 0 0 15px rgba(0, 200, 100, 0.3);
        }

        .milestone.active {
          background: rgba(255, 215, 0, 0.15);
          border-color: #ffd700;
          box-shadow: 0 0 20px rgba(255, 215, 0, 0.4);
          transform: scale(1.05);
        }

        .milestone.locked {
          opacity: 0.5;
        }

        .milestone-number {
          font-size: 18px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 8px;
        }

        .milestone-rewards {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .coin-reward, .diamond-reward {
          color: #e0e0e0;
          font-weight: bold;
        }

        .diamond-reward {
          color: #87ceeb;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 3px;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #ffd700, #ffa500);
          transition: width 0.3s ease;
        }

        .progress-text {
          position: absolute;
          font-size: 10px;
          top: -12px;
          right: 0;
          color: #ffd700;
          font-weight: bold;
        }

        .cosmetics-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: rgba(255, 215, 0, 0.9);
          color: #000;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
