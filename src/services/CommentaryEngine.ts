export interface CommentaryLine {
  text: string;
  priority: number; // 0-10, higher = urgent
  duration: number; // seconds
  tags: string[];
}

export class CommentaryEngine {
  private commentaryQueue: CommentaryLine[] = [];
  private currentlyPlaying: CommentaryLine | null = null;
  private playingStartTime = 0;

  private commentaryLibrary: Record<string, CommentaryLine[]> = {
    kickoff: [
      { text: "And we're underway! Let's see how this match develops.", priority: 8, duration: 2.5, tags: ['match-start'] },
      { text: 'The ball is in play. Here we go!', priority: 7, duration: 2, tags: ['match-start'] },
      { text: 'Both teams are ready to battle for supremacy today.', priority: 6, duration: 2.5, tags: ['match-start'] },
    ],
    goal: [
      { text: 'GOALLLL! What a strike! The ball is in the back of the net!', priority: 10, duration: 3, tags: ['goal', 'exciting'] },
      { text: 'YESSS! GOAL! Brilliant finish!', priority: 10, duration: 2.5, tags: ['goal', 'exciting'] },
      { text: 'The ball is in! What a moment! GOOOOAL!', priority: 10, duration: 3, tags: ['goal', 'exciting'] },
    ],
    shot: [
      { text: 'Shot! and... it flies wide!', priority: 6, duration: 2, tags: ['shot', 'missed'] },
      { text: 'Effort on goal, but the keeper collects it.', priority: 6, duration: 2, tags: ['shot', 'saved'] },
      { text: 'Chance here... the shot goes just over the bar!', priority: 7, duration: 2.5, tags: ['shot', 'close'] },
    ],
    corner: [
      { text: 'Corner kick! This could be dangerous.', priority: 5, duration: 2, tags: ['corner', 'set-piece'] },
      { text: 'The ball goes out. Corner kick awarded.', priority: 4, duration: 1.5, tags: ['corner', 'set-piece'] },
    ],
    foul: [
      { text: 'That\'s a foul! Free kick awarded.', priority: 5, duration: 2, tags: ['foul', 'free-kick'] },
      { text: 'A reckless challenge! The referee points to the spot.', priority: 6, duration: 2, tags: ['foul', 'penalty'] },
      { text: 'Yellow card! That\'s a booking.', priority: 6, duration: 2, tags: ['foul', 'yellow-card'] },
    ],
    offside: [
      { text: 'Offside! Play is stopped. Free kick to the defending team.', priority: 7, duration: 2.5, tags: ['offside', 'free-kick'] },
      { text: "That's offside. The flag goes up.", priority: 6, duration: 2, tags: ['offside'] },
    ],
    halltime: [
      { text: "And that's the end of the first half! We'll be back after the break.", priority: 8, duration: 2.5, tags: ['half-time'] },
      { text: 'Half time! What an entertaining first forty-five minutes!', priority: 8, duration: 2.5, tags: ['half-time'] },
    ],
    fulltime: [
      { text: 'Full time! What a match that was!', priority: 10, duration: 2.5, tags: ['full-time'] },
      { text: 'The final whistle goes! The match is over!', priority: 10, duration: 2.5, tags: ['full-time'] },
    ],
    possession: [
      { text: 'The home team controlling the tempo now.', priority: 2, duration: 2, tags: ['possession', 'analysis'] },
      { text: 'Away team pressing hard! They want this.', priority: 3, duration: 2, tags: ['possession', 'analysis'] },
    ],
    penalty: [
      { text: 'Penalty kick! This could decide the match!', priority: 10, duration: 2.5, tags: ['penalty', 'crucial'] },
      { text: 'A penalty is awarded! High stakes now.', priority: 10, duration: 2.5, tags: ['penalty'] },
    ],
    tackle: [
      { text: 'Clean tackle! Good defending.', priority: 3, duration: 1.5, tags: ['tackle', 'defense'] },
      { text: 'A physical contest developing in midfield.', priority: 2, duration: 2, tags: ['tackle', 'analysis'] },
    ],
  };

  // Trigger commentary
  triggerCommentary(eventType: string, context?: { playerName?: string; teamName?: string }): void {
    const lines = this.commentaryLibrary[eventType] || [];
    if (lines.length === 0) return;

    const selectedLine = lines[Math.floor(Math.random() * lines.length)];

    // Replace placeholders
    let text = selectedLine.text;
    if (context?.playerName) {
      text = text.replace('{player}', context.playerName);
    }
    if (context?.teamName) {
      text = text.replace('{team}', context.teamName);
    }

    this.queueCommentary({
      ...selectedLine,
      text,
    });
  }

  // Queue commentary to play
  private queueCommentary(line: CommentaryLine): void {
    // If high priority and something is playing, interrupt
    if (line.priority > 7 && this.currentlyPlaying && this.currentlyPlaying.priority < 8) {
      this.commentaryQueue = [line, ...this.commentaryQueue];
      this.startPlayingNext();
    } else {
      this.commentaryQueue.push(line);
      if (!this.currentlyPlaying) {
        this.startPlayingNext();
      }
    }
  }

  // Play commentary
  private startPlayingNext(): void {
    if (this.commentaryQueue.length === 0) {
      this.currentlyPlaying = null;
      return;
    }

    this.currentlyPlaying = this.commentaryQueue.shift() || null;
    this.playingStartTime = Date.now();
  }

  // Check if commentary finished and move to next
  updateCommentary(): string | null {
    if (!this.currentlyPlaying) return null;

    const elapsed = (Date.now() - this.playingStartTime) / 1000;
    if (elapsed >= this.currentlyPlaying.duration) {
      this.startPlayingNext();
    }

    return this.currentlyPlaying?.text || null;
  }

  // Get current commentary text
  getCurrentCommentary(): string | null {
    return this.currentlyPlaying?.text || null;
  }

  // Mute commentary
  muteCommentary(): void {
    this.commentaryQueue = [];
    this.currentlyPlaying = null;
  }

  // Add custom commentary
  addCustomCommentary(text: string, priority: number = 5, duration: number = 2.5): void {
    this.triggerCommentary('possession', {}); // Use a generic event
    if (this.currentlyPlaying) {
      this.currentlyPlaying.text = text;
      this.currentlyPlaying.priority = priority;
      this.currentlyPlaying.duration = duration;
    }
  }
}

export class InputManager {
  private keyPressedState: Record<string, boolean> = {};
  private mousePosition = { x: 0, y: 0 };
  private touchData: Record<string, { startX: number; startY: number; currentX: number; currentY: number }> = {};

  // Initialize input listeners
  initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keyup', this.handleKeyUp.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    this.keyPressedState[event.key.toLowerCase()] = true;
  }

  private handleKeyUp(event: KeyboardEvent): void {
    this.keyPressedState[event.key.toLowerCase()] = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mousePosition = { x: event.clientX, y: event.clientY };
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchData['primary'] = {
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    };
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.touchData['primary']) {
      const touch = event.touches[0];
      this.touchData['primary'].currentX = touch.clientX;
      this.touchData['primary'].currentY = touch.clientY;
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    delete this.touchData['primary'];
  }

  // PC Controls
  isMovingForward(): boolean {
    return this.keyPressedState['w'] || this.keyPressedState['arrowup'];
  }

  isMovingBackward(): boolean {
    return this.keyPressedState['s'] || this.keyPressedState['arrowdown'];
  }

  isMovingLeft(): boolean {
    return this.keyPressedState['a'] || this.keyPressedState['arrowleft'];
  }

  isMovingRight(): boolean {
    return this.keyPressedState['d'] || this.keyPressedState['arrowright'];
  }

  isSprinting(): boolean {
    return this.keyPressedState['shift'];
  }

  isShootPressed(): boolean {
    return this.keyPressedState[' ']; // Space
  }

  isPassPressed(): boolean {
    return this.keyPressedState['e'];
  }

  isThroughBallPressed(): boolean {
    return this.keyPressedState['r'];
  }

  isSkillMovePressed(): boolean {
    return this.keyPressedState['q'];
  }

  isSwitchPlayerPressed(): boolean {
    return this.keyPressedState['f'];
  }

  isCallSupportPressed(): boolean {
    return this.keyPressedState['c'];
  }

  isCelebrationPressed(): boolean {
    return this.keyPressedState['v'];
  }

  // Mobile Controls
  getTouchJoystickInput(): { x: number; y: number } {
    if (!this.touchData['primary']) return { x: 0, y: 0 };

    const data = this.touchData['primary'];
    const deltaX = data.currentX - data.startX;
    const deltaY = data.currentY - data.startY;
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxMagnitude = 100; // deadzone

    if (magnitude < 10) return { x: 0, y: 0 };

    return {
      x: Math.min(1, deltaX / maxMagnitude),
      y: Math.min(1, deltaY / maxMagnitude),
    };
  }

  // Get mouse position for aiming
  getMouseDirection(): { x: number; y: number } {
    // Normalize to -1 to 1
    const x = (this.mousePosition.x / window.innerWidth) * 2 - 1;
    const y = (this.mousePosition.y / window.innerHeight) * 2 - 1;

    return { x, y };
  }

  // Cleanup
  destroy(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keyup', this.handleKeyUp.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }
}
