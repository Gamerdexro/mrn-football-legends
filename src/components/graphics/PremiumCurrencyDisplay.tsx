import React, { useEffect, useState } from 'react';

// Premium Currency Display with Animations

export const PremiumCurrencyDisplay: React.FC<{
  coins: number;
  diamonds: number;
}> = ({ coins, diamonds }) => {
  const [prevCoins, setPrevCoins] = useState(coins);
  const [prevDiamonds, setPrevDiamonds] = useState(diamonds);
  const [coinsAnimating, setCoinsAnimating] = useState(false);
  const [diamondsAnimating, setDiamondsAnimating] = useState(false);

  useEffect(() => {
    if (coins !== prevCoins) {
      setCoinsAnimating(true);
      setPrevCoins(coins);
      setTimeout(() => setCoinsAnimating(false), 600);
    }
  }, [coins, prevCoins]);

  useEffect(() => {
    if (diamonds !== prevDiamonds) {
      setDiamondsAnimating(true);
      setPrevDiamonds(diamonds);
      setTimeout(() => setDiamondsAnimating(false), 600);
    }
  }, [diamonds, prevDiamonds]);

  return (
    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
      {/* Coins */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ fontSize: '20px' }}>💰</span>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #fff8dc, #ffd700, #ffa500)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: coinsAnimating
              ? 'coinShine 0.6s ease, coinBounce 0.6s ease'
              : 'coinShine 3s ease infinite',
            textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
          }}
        >
          {coins.toLocaleString()}
        </span>
      </div>

      {/* Diamonds */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(135, 206, 235, 0.1)',
          border: '1px solid rgba(135, 206, 235, 0.3)',
          borderRadius: '8px',
          backdropFilter: 'blur(10px)',
        }}
      >
        <span style={{ fontSize: '20px' }}>💎</span>
        <span
          style={{
            fontSize: '18px',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #e0ffff, #87ceeb, #4169e1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: diamondsAnimating
              ? 'diamondShine 0.6s ease, diamondBounce 0.6s ease'
              : 'diamondShine 3s ease infinite',
            textShadow: '0 0 10px rgba(135, 206, 235, 0.5)',
          }}
        >
          {diamonds}
        </span>
      </div>

      <style>{`
        @keyframes coinShine {
          0%, 100% { opacity: 1; }
          50% { opacity: 1.3; }
        }

        @keyframes coinBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes diamondShine {
          0%, 100% { opacity: 1; }
          50% { opacity: 1.3; }
        }

        @keyframes diamondBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};
