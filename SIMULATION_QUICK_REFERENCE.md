# IMPLEMENTATION QUICK REFERENCE

## 📁 File Structure

```
src/
├── types/
│   └── simulation.ts                 ← All type definitions
│
├── services/
│   ├── EnterpriseSimulationEngine.ts  ← Master controller
│   ├── SimulationIntegration.ts       ← Integration hooks
│   │
│   ├── formations/
│   │   └── TacticalFormationsEngine.ts
│   │
│   ├── ai/
│   │   └── AdaptiveLearningMemory.ts
│   │
│   ├── biomechanics/
│   │   └── BiomechanicsEngine.ts
│   │
│   ├── goalkeeper/
│   │   └── GoalkeeperNeuralEngine.ts
│   │
│   ├── antiexploit/
│   │   └── AntiExploitStaminaSystem.ts
│   │
│   └── config/
│       └── RemoteConfigSystem.ts
│
└── ENTERPRISE_SIMULATION_GUIDE.md     ← Full documentation
```

## 🚀 QUICK START

### 1. Create the engine (in React component)

```typescript
const engine = new EnterpriseFootballSimulationEngine(offlineMode);
await engine.initialize();
```

### 2. Update every frame (in useFrame)

```typescript
engine.update(deltaTime, gameState);
```

### 3. Use in game logic

```typescript
// Formations
const anchors = engine.formations.getFormationAnchors();

// AI Learning
engine.aiMemory.recordPlayerAction(playerId, metric);

// Injuries
engine.biomechanics.applyInjury(playerId, injuryData);

// Goalkeeper
const prediction = engine.keeperPrediction.predictShotTrajectory(shot);

// Anti-Exploit
const drainMult = engine.antiExploit.handleSprintToggle(playerId);

// Config
const param = engine.remoteConfig.getParameter('sprint_drain_rate');
```

### 4. Shutdown

```typescript
engine.shutdown();
```

## 📊 SYSTEM QUICK REFERENCE

| System | Purpose | Key Method | Update Rate |
|--------|---------|-----------|------------|
| **Formations** | Tactical positioning | `calculateFormationOffset()` | 10Hz |
| **AI Memory** | Pattern learning | `recordPlayerAction()` | Event |
| **Biomechanics** | Injury physics | `calculateInjuryProbability()` | 3Hz |
| **Goalkeeper** | Shot prediction | `predictShotTrajectory()` | Event |
| **Anti-Exploit** | Spam detection | `handleSprintToggle()` | 1Hz |
| **Remote Config** | Balance tuning | `getParameter()` | Background |

## 🔗 KEY INTEGRATION POINTS

### AIPlayer.tsx
```typescript
// Record opponent actions
aiMemoryHooks.recordPlayerAction(engine, opponentId, 'SHOT', value, confidence);

// Get anticipation bias
const bias = aiMemoryHooks.getAIAnticipation(engine, opponentId, 'SHOT');
```

### Goalkeeper.tsx
```typescript
// Predict shot
const prediction = goalkeeperHooks.predictShot(engine, shooterPos, shotVector, ...);

// Decide action
if (prediction.shouldAttemptCatch) {
  goalkeeper.attemptCatch(prediction.optimalPosition);
} else {
  goalkeeper.dive(prediction.diveDirectionScore.selectedZone);
}
```

### Physics/Collision.ts
```typescript
// Handle collision
injuryHooks.handleCollision(engine, playerId, mass, relVelocity, stamina, type);

// Apply penalty
const mod = injuryHooks.getPlayerPerformanceModifier(engine, playerId);
player.speed *= mod;
```

### Input Controls
```typescript
// Handle player input
const drainMult = antiExploitHooks.handleSprintToggle(engine, playerId);
player.staminaDrain *= drainMult;
```

### Game Initialization
```typescript
// Get AI difficulty values
const reactionDelay = configHooks.getParameter(engine, 'ai_reaction_min_delay');
const passAccuracy = configHooks.getParameter(engine, 'ai_passing_accuracy');
```

## 📈 MONITORING

### Get System Health
```typescript
const health = engine.getSystemHealth();
// { formations: true, aiMemory: true, ... }
```

### Log Metrics (every 30 seconds)
```typescript
engine.logSystemMetrics();
```

### Get Full Info
```typescript
const info = engine.getSystemInfo();
console.log(info);
```

## 🎚️ TUNING PARAMETERS

### Via Remote Config

```typescript
await engine.remoteConfig.setParameterBatch(new Map([
  ['sprint_drain_rate', 18],
  ['ai_passing_accuracy', 0.78],
  ['injury_threshold_multiplier', 1.1]
]));
```

### Available Parameters

**AI Weights**
- `ai_reaction_min_delay` (80-350ms)
- `ai_passing_accuracy` (0.5-0.95)
- `ai_shot_power_variance` (0.05-0.45)

**Stamina**
- `sprint_drain_rate` (10-25 per sec)
- `high_press_drain_rate` (5-15 per sec)
- `skill_move_stamina_cost` (5-25)

**Injuries**
- `injury_threshold_multiplier` (0.5-2.0)
- `micro_damage_threshold` (50-200)

**Difficulty**
- `beginner_reaction_boost` (100-300ms)
- `elite_reaction_penalty` (-150 to 0ms)

**Formation**
- `formation_compactness_factor` (0.7-1.3)
- `offside_trap_tolerance` (0.2-2.0m)

## 🐛 COMMON DEBUG SCENARIOS

### Check if AI is learning correctly
```typescript
const pattern = engine.aiMemory.getPatternAnalysis(playerId);
console.log('Shot confidence:', pattern.shotDirectionConfidence);
```

### Check injury status
```typescript
const injured = engine.biomechanics.getInjuredPlayers();
injured.forEach(p => console.log(p.playerId, p.currentInjury));
```

### Check GK memory
```typescript
const gkInfo = engine.keeperPrediction.getPatternAnalysis();
console.log('Memory size:', gkInfo.patternMemorySize);
```

### Check exploit detection
```typescript
const tracking = engine.antiExploit.getTrackingStats();
console.log('Players with sprint abuse:', tracking.sprintTrackingPlayers);
```

### Check config status
```typescript
const configInfo = engine.remoteConfig.getVersionInfo();
console.log('Online:', configInfo.isOnline);
console.log('Valid:', configInfo.isValid);
```

## ✅ IMPLEMENTATION CHECKLIST

- [ ] Import `EnterpriseFootballSimulationEngine` in main game component
- [ ] Initialize engine in `useEffect` with `await engine.initialize()`
- [ ] Call `engine.update()` every frame in `useFrame`
- [ ] Integrate `AIMemoryHooks` in AIPlayer component
- [ ] Integrate `GoalkeeperHooks` in Goalkeeper component
- [ ] Integrate `InjuryHooks` in collision handlers
- [ ] Integrate `AntiExploitHooks` in input controls
- [ ] Integrate `FormationHooks` for offside/pressing logic
- [ ] Integrate `ConfigHooks` for difficulty adjustments
- [ ] Set up monitoring/logging for metrics
- [ ] Test all systems individually
- [ ] Tune parameters via remote config
- [ ] Implement A/B testing setup
- [ ] Deploy and monitor player behavior

## 📞 TROUBLESHOOTING

**Engine won't initialize**
- Check internet connection for config fetch
- Verify Firebase credentials
- Check browser console for errors

**Memory growing over time**
- Call `engine.aiMemory.decayMemory()` regularly
- Call `engine.biomechanics.clearAllInjuries()` at match end

**Systems showing unhealthy**
- Check `engine.getSystemHealth()` for details
- Look at last logged error in console
- Verify all services instantiated correctly

**Config parameters not applied**
- Verify parameters are within bounds
- Check if parameter is locked (cannot be modified)
- Use `engine.remoteConfig.exportConfig()` to verify

**Performance issues**
- Check update rates are appropriate
- Profile in DevTools
- Reduce formation zone complexity if necessary

---

**Need more details? See: ENTERPRISE_SIMULATION_GUIDE.md**
