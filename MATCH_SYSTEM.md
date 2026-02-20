# MRN Football Legends - Complete Match System Documentation

## Overview

This documentation covers the comprehensive match system implementation including friendly PvP, player controls, AI, stadium environment, commentary, penalties, and all supporting systems.

## System Architecture

```
Match System
├── Core Engine
│   ├── MatchPhysicsEngine
│   ├── FriendlyMatchService
│   ├── AIControllerService
│   └── InputManager
├── Game Rules
│   ├── OffsideDetectionService
│   ├── StaminaSystem
│   ├── CelebrationSystem
│   └── PenaltyShootoutService
├── UI Components
│   ├── MatchHUD
│   ├── Scoreboard
│   ├── MatchScreens (Celebration, Results, Team Selection)
│   ├── FriendlyMatchLobby
│   └── PenaltyAndInvitations
└── State Management
    └── useMatchStore (Zustand)
```

## 1. Match System & Friendly PvP Structure

### Friendly Match Flow
```
Idle → Team Select → Countdown → In-Play → Half-Time → Full-Time
```

### Matchmaking
- **Quick Join**: Automatic team assignment
- **Lobby System**: Players create and join custom lobbies
- **Friend Invites**: Direct invitations to friends
- **Connection Check**: Ping quality verification before start

### Lobby Features
- Customizable match duration (15-90 minutes per half)
- Stadium selection
- AI difficulty levels
- Rule configuration
- Spectator allowance
- Player readiness confirmation

## 2. Player Movement & Controls

### PC Controls
| Key | Action |
|-----|--------|
| W/A/S/D | Movement |
| Arrow Keys | Movement |
| Shift | Sprint (limited stamina) |
| Space | Pass / Shoot |
| E | Through Ball |
| R | Lofted Pass |
| Q | Skill Move |
| F | Switch Player |
| C | Call Support |
| V | Celebration |
| ESC | Pause |

### Mobile Controls
- **Left Joystick**: Movement
- **Right Buttons**: Action buttons (Pass, Shoot, Sprint)
- **Tap + Hold**: Shoot power buildup
- **Swipe Gestures**: Skill moves
- **Auto-switch Toggle**: Player switching mode

### Control State
```typescript
ControlState {
  moveForward, moveBackward, moveLeft, moveRight
  sprint, shoot, pass, throughBall
  skillMove, switchPlayer, callSupport
  celebration, shootPower, shootDirection
}
```

## 3. Stadium Environment

### Stadium Components
- **Pitch**: Standard 105m x 68m with markings
- **Lighting**: Dynamic lighting (day/night modes)
- **Grass**: Natural or artificial turf
- **Stands**: Crowd animations and reactions
- **Markings**: Penalty area, center circle, offside lines

### Weather System
```typescript
WeatherState {
  condition: 'sunny' | 'rainy' | 'cloudy' | 'snowy' | 'night'
  windSpeed: number
  visibility: number
  ballFriction: number
  playerTraction: number
}
```

### Crowd System
- **Mood States**: neutral, excited, angry, disappointed
- **Animations**: Clap, wave, jump, flag waving
- **Sound Dynamics**: Volume adjusts based on game events
- **Announcer**: Stadium announcer calls goals, cards, substitutions

## 4. Match Physics

### Ball Physics
```typescript
BallPhysics {
  position: Vector3
  velocity: Vector3
  rotation: Vector3
  angularVelocity: Vector3
  isInAir: boolean
  lastToucher: string
  spin: number
  friction: number
}
```

### Physics Constants
- **Gravity**: -9.81 m/s²
- **Air Resistance**: 0.98
- **Ground Friction**: 0.95
- **Bounce Coefficient**: 0.6

### Collision Detection
- Player-ball collision radius: 0.5m
- Goal detection at boundary
- Out of bounds detection
- Tackle collision vectors

## 5. Shooting & Passing

### Shooting Mechanics
```
Power × PlayerStats.shotPower / 100 = Initial Velocity
Direction Input = Trajectory Aim
Stamina = Accuracy Modifier
Distance = Power Decay
```

### Passing System
- **Ground Pass**: Quick tap
- **Lofted Pass**: Hold for duration
- **Through Ball**: Special pass breaking defensive lines
- **Assist Tracking**: Records assists with goals

### Accuracy Calculation
```typescript
passAccuracy = (control × 0.6 + stamina × 0.3 - distance × 0.1) × 100
```

## 6. Skills & Celebrations

### Available Skills
- Step-over
- Elastico
- Drag back
- Heel flick
- Nutmeg
- Ball roll
- Scoop turn

### 25 Celebration Types
1. Slide on knees
2. Arms spread wide
3. Backflip
4. Heart hand sign
5. Knee pump
6. Jump turn
7. Shush gesture
8. Point to sky
9. Chest pound
10. Spin around
11. Group celebration
12. Fist pump
13. Run to corner
14. Pop-off dance
15. Knee tap
16. Salute
17. Shoulder shimmy
18. Slide then flip
19. Slow walk & wink
20. Jumping jacks
21. Breakdance
22. Statue pose
23. Taunt shrug
24. Wave to crowd
25. Flex

### Celebration Impact
- **Crowd Reaction**: 0-100% intensity boost
- **Momentum**: +0.05 to +0.15 team momentum
- **Duration**: 1.5 - 4 seconds per celebration

## 7. Offside System

### Offside Detection
```typescript
checkOffside(passer, receiver, defenders) {
  // Receiver behind passer at pass moment
  // Receiver ahead of second-last defender
  // Receiver in opponent's half
}
```

### Offside Rules
- Not enforced in own half
- Second-last defender line checked
- Flag animation on offside
- Free kick awarded to defending team

## 8. Stamina System

### Stamina Mechanics
- **Max Stamina**: 100%
- **Sprint Drain**: 8 per second
- **Movement Drain**: 2 per second
- **Recovery Rate**: 1.5 per second (idle)

### Speed Modifier
| Stamina | Modifier |
|---------|----------|
| > 80% | 1.0 |
| 50-80% | 0.95 |
| 30-50% | 0.85 |
| < 30% | 0.7 |

## 9. Penalty Shootout

### Penalty Flow
1. Player aims (left, center, right)
2. Power selection (0-100%)
3. Goalkeeper AI guess
4. Shot accuracy calculation
5. Result determination

### Goalkeeper AI
```typescript
// Difficulty affects guessing accuracy
easy: 30% guess correct
normal: 50% guess correct
hard: 70% guess correct
expert: 85% guess correct
```

### Scoring Formula
```
scoreChance = playerAccuracy
if (power > 0.9) scoreChance *= 0.85
if (gkGuessCorrect) scoreChance *= (1 - saveChance)
```

## 10. Possession & Momentum

### Possession Calculation
```typescript
homePossession = (homePassEvents / totalPassEvents) × 100
```

### Momentum System
- Affected by celebrations
- Impacts gameplay dynamics
- Influences AI aggression
- Resets on possession change

## 11. Commentary Engine

### Commentary Categories
- Kickoff
- Goals
- Shots
- Corners
- Fouls
- Offside
- Half-time
- Full-time
- Possession analysis
- Penalties
- Tackles

### Commentary Queue
- Priority-based playback
- High-priority interrupts low-priority
- Dynamic player name insertion
- Mutable for player preference

## 12. AI System

### AI Decision Making
```typescript
decideNextAction(player, teammates, opponents, ball) {
  if (distanceToBall > threshold) return 'defend'
  if (closeToGoal && good_shot_stats) return 'shoot'
  if (safe_receiver_available) return 'pass'
  return 'dribble'
}
```

### AI Positioning
- Defender: Maintain formation, mark zones
- Midfielder: Support play, recycle possession
- Attacker: Time runs for through balls
- Goalkeeper: React to shots, organize defense

## 13. Match Events & Statistics

### Event Types
- Goal
- Assist
- Shot
- Foul
- Tackle
- Pass
- Own goal
- Penalty
- Offside
- Corner/Throw-in
- Substitution

### Match Statistics
- Shots / Shots on target
- Passes / Pass accuracy
- Tackles / Interceptions
- Possession percentage
- Fouls committed
- Yellow/Red cards
- Saves
- Possession time

## 14. Player Attributes

### Stats (0-100)
- Speed: Player movement pace
- Acceleration: Quick start speed
- Control: Ball handling
- Strength: Physical challenges
- Shot Power: Shot force
- Passing: Pass accuracy
- Defense: Defensive capability
- Stamina: Endurance
- Agility: Direction change
- Heading: Header accuracy

## 15. Kit Customization

### Kit Options
- Jersey (color/number)
- Shorts color
- Boots style
- Badge/Logo
- Visible on minimap & scoreboard

## 16. Social Features

### Friend Integration
- Invite specific friends
- See online status
- Send match invitations
- Post-match stats sharing
- Voice chat support

### Messages
- Pre-match: Team selection chat
- Post-match: Results sharing
- Emote wheel pre-goal celebrations
- Lobby communication

## 17. Integration Points

### With Main App
- Authentication integration
- Player squad loading
- Stats persistence
- Economy integration
- Social system connection

## Component Structure

```
MatchCenter (Main orchestrator)
├── Lobby Phase
│   ├── FriendlyMatchLobby
│   └── LobbyWaiting
├── Team Selection Phase
│   └── TeamSelection
├── In-Game Phase
│   ├── MatchHUD
│   ├── 3D Game Renderer
│   ├── CelebrationMenu
│   └── FriendInvitation
├── Penalty Phase
│   └── PenaltyShootout
└── Result Phase
    └── ResultScreen
```

## Store Management (Zustand)

### Main Match Store Actions
- `initializeMatch()`: Set up match
- `updateMatchTime()`: Progress clock
- `updateBallPosition()`: Physics update
- `selectPlayer()`: Change controlled player
- `scoreGoal()`: Record goal
- `togglePause()`: Pause/resume
- `endMatch()`: Complete match

## Usage Example

```typescript
import { MatchCenter } from '@/components/match/MatchCenter';

export function GameView() {
  return (
    <MatchCenter onExit={() => navigate('/menu')} />
  );
}
```

## Performance Considerations

1. **Physics Loop**: Runs at ~60fps with delta-time updates
2. **AI Processing**: Async decision-making queue
3. **Stamina Updates**: Per-frame calculations
4. **Commentary**: Queued and prioritized

## Future Enhancements

- Multiplayer match-making
- Skill progression system
- Team formation presets
- Custom rules saving
- Replay system
- Advanced statistics tracking
- Seasonal rankings
- Match highlights generation
