// Full Season Simulation Engine
// Simulates league table, team form, morale, and match results

export interface TeamSeasonState {
  teamId: string;
  attackRating: number;
  defenseRating: number;
  staminaDepth: number;
  form: number;
  morale: number;
  points: number;
  goalDifference: number;
  headToHead: Record<string, number>;
}

export interface MatchResult {
  homeTeamId: string;
  awayTeamId: string;
  homeGoals: number;
  awayGoals: number;
  events: Array<{ type: string; playerId?: string; value?: number }>;
}

export class SeasonSimulationEngine {
  teams: TeamSeasonState[];
  leagueTable: TeamSeasonState[];

  constructor(teams: TeamSeasonState[]) {
    this.teams = teams;
    this.leagueTable = [...teams];
  }

  simulateMatch(home: TeamSeasonState, away: TeamSeasonState, homeFactor: number = 1.1): MatchResult {
    // xG calculation
    const recentForm = home.form;
    const xG = (home.attackRating * recentForm * homeFactor) / away.defenseRating;
    const awayxG = (away.attackRating * away.form) / home.defenseRating;
    // Poisson goals
    const homeGoals = this.poissonSample(xG);
    const awayGoals = this.poissonSample(awayxG);
    // Update team stats
    this.updateForm(home, homeGoals, awayGoals);
    this.updateForm(away, awayGoals, homeGoals);
    this.updateMorale(home, homeGoals > awayGoals);
    this.updateMorale(away, awayGoals > homeGoals);
    // Update league table
    this.updateLeagueTable(home, away, homeGoals, awayGoals);
    // Events (simplified)
    const events = [];
    if (homeGoals > 0) events.push({ type: 'Goal', value: homeGoals });
    if (awayGoals > 0) events.push({ type: 'Goal', value: awayGoals });
    // Cards, injuries, assists, fatigue can be added
    return { homeTeamId: home.teamId, awayTeamId: away.teamId, homeGoals, awayGoals, events };
  }

  poissonSample(xG: number): number {
    let L = Math.exp(-xG);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  updateForm(team: TeamSeasonState, goalsFor: number, goalsAgainst: number) {
    const performance = goalsFor - goalsAgainst;
    team.form = team.form * 0.8 + performance * 0.2;
  }

  updateMorale(team: TeamSeasonState, win: boolean) {
    if (win) team.morale += 5;
    else team.morale -= 3;
    // 3-loss streak logic can be added
  }

  updateLeagueTable(home: TeamSeasonState, away: TeamSeasonState, homeGoals: number, awayGoals: number) {
    if (homeGoals > awayGoals) home.points += 3;
    else if (homeGoals < awayGoals) away.points += 3;
    else { home.points += 1; away.points += 1; }
    home.goalDifference += homeGoals - awayGoals;
    away.goalDifference += awayGoals - homeGoals;
    // Head-to-head, transfer window, injuries, etc. can be expanded
  }

  // Sync, remote config, and difficulty scaling can be added
}
