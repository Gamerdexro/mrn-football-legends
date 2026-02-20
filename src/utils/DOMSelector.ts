/**
 * DOM Selection utilities for MRN Football Legends
 * Provides helper functions to select and manipulate game elements
 */

export class DOMSelector {
  /**
   * Select single element by ID
   */
  static byId(id: string): HTMLElement | null {
    return document.getElementById(id);
  }

  /**
   * Select single element by CSS selector
   */
  static select(selector: string): HTMLElement | null {
    return document.querySelector(selector);
  }

  /**
   * Select multiple elements by CSS selector
   */
  static selectAll(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector);
  }

  /**
   * Game-specific selectors
   */
  static gameElements = {
    // Player elements
    playerCard: (playerId: string) => `.player-card[data-player-id="${playerId}"]`,
    playerName: (playerId: string) => `.player-name[data-player-id="${playerId}"]`,
    playerStats: (playerId: string) => `.player-stats[data-player-id="${playerId}"]`,
    
    // Match elements
    scoreBoard: '#score-board',
    matchTimer: '#match-timer',
    field: '#football-field',
    
    // UI elements
    playButton: '#play-button',
    menuButtons: '.menu-button',
    modal: '.modal-overlay',
    closeButton: '.close-button',
    
    // Event elements
    eventCard: (eventId: string) => `.event-card[data-event-id="${eventId}"]`,
    eventLeaderboard: (eventId: string) => `#leaderboard-${eventId}`,
    
    // Mission elements
    missionItem: (missionId: string) => `.mission-item[data-mission-id="${missionId}"]`,
    missionProgress: (missionId: string) => `.mission-progress[data-mission-id="${missionId}"]`,
    
    // Prestige elements
    prestigeBadge: '.prestige-badge',
    prestigeProgress: '.prestige-progress-bar',
    
    // Store elements
    storeItem: (itemId: string) => `.store-item[data-item-id="${itemId}"]`,
    currencyDisplay: '.currency-display',
    
    // Loading elements
    loadingScreen: '#loading-screen',
    progressBar: '.progress-bar',
    
    // Settings elements
    settingsPanel: '#settings-panel',
    volumeSlider: '#volume-slider',
    qualitySelect: '#quality-select'
  };

  /**
   * Find element with fallback
   */
  static findWithFallback(selectors: string[]): HTMLElement | null {
    for (const selector of selectors) {
      const element = this.select(selector);
      if (element) return element;
    }
    return null;
  }

  /**
   * Wait for element to appear
   */
  static waitForElement(selector: string, timeout: number = 5000): Promise<HTMLElement | null> {
    return new Promise((resolve) => {
      const element = this.select(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const foundElement = this.select(selector);
        if (foundElement) {
          observer.disconnect();
          resolve(foundElement);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }

  /**
   * Check if element exists
   */
  static exists(selector: string): boolean {
    return this.select(selector) !== null;
  }

  /**
   * Get element's text content
   */
  static getText(selector: string): string {
    const element = this.select(selector);
    return element ? element.textContent || '' : '';
  }

  /**
   * Set element's text content
   */
  static setText(selector: string, text: string): void {
    const element = this.select(selector);
    if (element) {
      element.textContent = text;
    }
  }

  /**
   * Add CSS class to element
   */
  static addClass(selector: string, className: string): void {
    const element = this.select(selector);
    if (element) {
      element.classList.add(className);
    }
  }

  /**
   * Remove CSS class from element
   */
  static removeClass(selector: string, className: string): void {
    const element = this.select(selector);
    if (element) {
      element.classList.remove(className);
    }
  }

  /**
   * Toggle CSS class on element
   */
  static toggleClass(selector: string, className: string): void {
    const element = this.select(selector);
    if (element) {
      element.classList.toggle(className);
    }
  }

  /**
   * Get element's attribute value
   */
  static getAttribute(selector: string, attribute: string): string | null {
    const element = this.select(selector);
    return element ? element.getAttribute(attribute) : null;
  }

  /**
   * Set element's attribute value
   */
  static setAttribute(selector: string, attribute: string, value: string): void {
    const element = this.select(selector);
    if (element) {
      element.setAttribute(attribute, value);
    }
  }

  /**
   * Get all data attributes from element
   */
  static getDataAttributes(selector: string): Record<string, string> {
    const element = this.select(selector);
    if (!element) return {};

    const data: Record<string, string> = {};
    for (let i = 0; i < element.attributes.length; i++) {
      const attr = element.attributes[i];
      if (attr.name.startsWith('data-')) {
        data[attr.name] = attr.value;
      }
    }
    return data;
  }

  /**
   * Click element programmatically
   */
  static click(selector: string): void {
    const element = this.select(selector) as HTMLButtonElement;
    if (element) {
      element.click();
    }
  }

  /**
   * Focus element
   */
  static focus(selector: string): void {
    const element = this.select(selector) as HTMLElement;
    if (element) {
      element.focus();
    }
  }

  /**
   * Check if element is visible
   */
  static isVisible(selector: string): boolean {
    const element = this.select(selector);
    if (!element) return false;

    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }

  /**
   * Scroll element into view
   */
  static scrollIntoView(selector: string, behavior: 'smooth' | 'auto' = 'smooth'): void {
    const element = this.select(selector);
    if (element) {
      element.scrollIntoView({ behavior, block: 'center' });
    }
  }

  /**
   * Get element's position and size
   */
  static getRect(selector: string): DOMRect | null {
    const element = this.select(selector);
    return element ? element.getBoundingClientRect() : null;
  }

  /**
   * Create event listener for element
   */
  static onClick(selector: string, callback: (event: MouseEvent) => void): void {
    const element = this.select(selector);
    if (element) {
      element.addEventListener('click', callback);
    }
  }

  /**
   * Remove event listener from element
   */
  static offClick(selector: string, callback: (event: MouseEvent) => void): void {
    const element = this.select(selector);
    if (element) {
      element.removeEventListener('click', callback);
    }
  }
}

/**
 * React Hook for DOM Selection
 */
export function useDOMSelector() {
  const selectElement = (selector: string) => DOMSelector.select(selector);
  const selectAll = (selector: string) => DOMSelector.selectAll(selector);
  const exists = (selector: string) => DOMSelector.exists(selector);
  const waitFor = (selector: string, timeout?: number) => DOMSelector.waitForElement(selector, timeout);

  return {
    selectElement,
    selectAll,
    exists,
    waitFor,
    gameElements: DOMSelector.gameElements
  };
}
