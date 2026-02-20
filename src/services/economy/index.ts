// Economy System API - Main export for game integration

export {
  SeasonRewardSystem,
  type SeasonMetadata,
  type MilestoneDefinition,
} from './SeasonRewardSystem';

export {
  PerformanceIndexScoreEngine,
  type MatchPerformanceMetrics,
} from './PerformanceIndexScoreEngine';

export {
  EconomyEngine,
  type RewardPacket,
} from './EconomyEngine';

export {
  AntiInflationSystem,
  type InflationMetrics,
  type EconomyAdjustments,
} from './AntiInflationSystem';

export {
  MarketSelfCorrectionEngine,
  type PlayerMarketListing,
} from './MarketSelfCorrectionEngine';

export {
  OfflineFirstSyncEngine,
  type SyncPacket,
} from './OfflineFirstSyncEngine';

export {
  LongTermStabilityModel,
  type EconomyPhase,
  type PhaseConfiguration,
} from './LongTermStabilityModel';

export {
  MasterEconomyOrchestrator,
  type MatchRewardPackage,
} from './MasterEconomyOrchestrator';

export {
  FootballEconomyMetricsEngine,
  type FootballPlayerMetrics,
  type FootballMatchContext,
} from './FootballEconomyMetrics';
