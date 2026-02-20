import React, { useEffect, useRef } from 'react';
import { DOMSelector, useDOMSelector } from '../utils/DOMSelector';

/**
 * Examples of selecting elements in MRN Football Legends
 */
export const ElementSelectionExamples = () => {
  const { selectElement, selectAll, exists, waitFor, gameElements } = useDOMSelector();
  const playerCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Example 1: Select player card by ID
    const playerCard = DOMSelector.byId('player-card-123');
    if (playerCard) {
      console.log('Found player card:', playerCard);
    }

    // Example 2: Select all menu buttons
    const menuButtons = DOMSelector.selectAll('.menu-button');
    console.log('Found menu buttons:', menuButtons.length);

    // Example 3: Use game-specific selectors
    const scoreBoard = DOMSelector.select(gameElements.scoreBoard);
    const playerName = DOMSelector.select(gameElements.playerName('123'));
    
    // Example 4: Check if element exists
    if (DOMSelector.exists(gameElements.playButton)) {
      console.log('Play button exists');
    }

    // Example 5: Wait for element to appear
    waitFor(gameElements.loadingScreen).then(element => {
      if (element) {
        console.log('Loading screen appeared');
      }
    });

    // Example 6: Manipulate elements
    DOMSelector.setText(gameElements.matchTimer, '45:00');
    DOMSelector.addClass(gameElements.playButton, 'glowing');
    DOMSelector.setAttribute(gameElements.playerCard('456'), 'data-active', 'true');

    // Example 7: Get data attributes
    const playerData = DOMSelector.getDataAttributes(gameElements.playerCard('123'));
    console.log('Player data:', playerData);

    // Example 8: Event listeners
    DOMSelector.onClick(gameElements.playButton, () => {
      console.log('Play button clicked');
    });

  }, []);

  const handlePlayerCardClick = () => {
    if (playerCardRef.current) {
      // Direct DOM manipulation through ref
      playerCardRef.current.classList.add('selected');
      
      // Get player ID from data attribute
      const playerId = playerCardRef.current.getAttribute('data-player-id');
      console.log('Selected player:', playerId);
    }
  };

  return (
    <div>
      {/* Example 9: Using refs in React */}
      <div 
        ref={playerCardRef}
        className="player-card" 
        data-player-id="123"
        onClick={handlePlayerCardClick}
      >
        <span className="player-name">Player Name</span>
        <div className="player-stats">Stats here</div>
      </div>

      {/* Example 10: Selecting multiple elements */}
      <div className="mission-list">
        <div className="mission-item" data-mission-id="1">Mission 1</div>
        <div className="mission-item" data-mission-id="2">Mission 2</div>
        <div className="mission-item" data-mission-id="3">Mission 3</div>
      </div>

      {/* Example 11: Dynamic selection */}
      <button 
        onClick={() => {
          // Select all mission items and add highlight class
          const missions = selectAll('.mission-item');
          missions.forEach(mission => {
            mission.classList.add('highlight');
          });
        }}
      >
        Highlight All Missions
      </button>
    </div>
  );
};

/**
 * Advanced selection patterns
 */
export const AdvancedSelectionPatterns = () => {
  const selectElementsByText = (text: string): HTMLElement[] => {
    const elements = document.querySelectorAll('*');
    const matches: HTMLElement[] = [];
    
    elements.forEach(element => {
      if (element.textContent?.includes(text)) {
        matches.push(element as HTMLElement);
      }
    });
    
    return matches;
  };

  const selectNearestElement = (from: HTMLElement, selector: string): HTMLElement | null => {
    const elements = document.querySelectorAll(selector);
    let nearest: HTMLElement | null = null;
    let minDistance = Infinity;
    
    elements.forEach(element => {
      const distance = from.getBoundingClientRect().top - 
                   (element as HTMLElement).getBoundingClientRect().top;
      if (Math.abs(distance) < minDistance) {
        minDistance = Math.abs(distance);
        nearest = element as HTMLElement;
      }
    });
    
    return nearest;
  };

  const selectInViewport = (): HTMLElement[] => {
    const elements = document.querySelectorAll('*');
    const inViewport: HTMLElement[] = [];
    const viewport = {
      top: window.scrollY,
      bottom: window.scrollY + window.innerHeight
    };
    
    elements.forEach(element => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      
      if (absoluteTop >= viewport.top && absoluteTop <= viewport.bottom) {
        inViewport.push(element as HTMLElement);
      }
    });
    
    return inViewport;
  };

  return (
    <div>
      <h3>Advanced Selection Examples</h3>
      <button onClick={() => {
        const playButtons = selectElementsByText('PLAY');
        console.log('Elements with PLAY text:', playButtons);
      }}>
        Find Elements by Text
      </button>
      
      <button onClick={() => {
        const firstButton = DOMSelector.select('button');
        if (firstButton) {
          const nearestMission = selectNearestElement(firstButton, '.mission-item');
          console.log('Nearest mission:', nearestMission);
        }
      }}>
        Find Nearest Mission
      </button>
      
      <button onClick={() => {
        const visibleElements = selectInViewport();
        console.log('Visible elements:', visibleElements.length);
      }}>
        Count Visible Elements
      </button>
    </div>
  );
};
