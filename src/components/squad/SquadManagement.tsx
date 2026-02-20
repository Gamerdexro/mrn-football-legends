import React, { useMemo, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import players from '../../data/players.json';
import { PlayerFace } from '../common/PlayerFace';
import { getKitForPlayer } from '../../data/jerseys';

type FormationStyle = 'ATTACKING' | 'BALANCED' | 'DEFENSIVE';

type FormationSlot = {
    id: string;
    top: string;
    left: string;
    role: 'GK' | 'DEF' | 'MID' | 'FWD';
};

type FormationMeta = {
    id: string;
    label: string;
    shape: string;
    style: FormationStyle;
    unlockTier: 'STARTER' | 'PREMIUM_SHOP' | 'MARKET_MEDIUM';
    positions: FormationSlot[];
};

type SquadBadgeType = 'ATTACK' | 'DEFENSE' | 'BALANCED';

type BadgeRequirement = 'FOUNDATION_XI' | 'SYNERGY_PAIR' | 'DEPTH_18';

type SquadBadge = {
    id: string;
    label: string;
    description: string;
    type: SquadBadgeType;
    attackBonus: number;
    midfieldBonus: number;
    defenseBonus: number;
    requirement: BadgeRequirement;
};

type SquadChallengeRequirement = 'FOUNDATION_XI' | 'SYNERGY_PAIR' | 'STANDARD_ONLY';

type SquadChallenge = {
    id: string;
    label: string;
    description: string;
    requirement: SquadChallengeRequirement;
};

const FORMATIONS: FormationMeta[] = [
    {
        id: '433_BALANCED',
        label: '4-3-3',
        shape: '4-3-3',
        style: 'BALANCED',
        unlockTier: 'STARTER',
        positions: [
            { id: 'GK', top: '85%', left: '50%', role: 'GK' },
            { id: 'LB', top: '65%', left: '20%', role: 'DEF' },
            { id: 'LCB', top: '70%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '70%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '65%', left: '80%', role: 'DEF' },
            { id: 'LCM', top: '47%', left: '35%', role: 'MID' },
            { id: 'CM', top: '50%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '47%', left: '65%', role: 'MID' },
            { id: 'LW', top: '25%', left: '25%', role: 'FWD' },
            { id: 'ST', top: '20%', left: '50%', role: 'FWD' },
            { id: 'RW', top: '25%', left: '75%', role: 'FWD' }
        ]
    },
    {
        id: '433_ATTACK',
        label: '4-3-3 Attack',
        shape: '4-3-3',
        style: 'ATTACKING',
        unlockTier: 'STARTER',
        positions: [
            { id: 'GK', top: '85%', left: '50%', role: 'GK' },
            { id: 'LB', top: '67%', left: '18%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '67%', left: '82%', role: 'DEF' },
            { id: 'LCM', top: '50%', left: '35%', role: 'MID' },
            { id: 'CM', top: '48%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '50%', left: '65%', role: 'MID' },
            { id: 'LW', top: '20%', left: '20%', role: 'FWD' },
            { id: 'ST', top: '18%', left: '50%', role: 'FWD' },
            { id: 'RW', top: '20%', left: '80%', role: 'FWD' }
        ]
    },
    {
        id: '433_DEF',
        label: '4-3-3 Def',
        shape: '4-3-3',
        style: 'DEFENSIVE',
        unlockTier: 'STARTER',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LB', top: '72%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '75%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '75%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '72%', left: '78%', role: 'DEF' },
            { id: 'LCM', top: '55%', left: '38%', role: 'MID' },
            { id: 'CM', top: '57%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '55%', left: '62%', role: 'MID' },
            { id: 'LW', top: '32%', left: '28%', role: 'FWD' },
            { id: 'ST', top: '28%', left: '50%', role: 'FWD' },
            { id: 'RW', top: '32%', left: '72%', role: 'FWD' }
        ]
    },
    {
        id: '4231_BALANCED',
        label: '4-2-3-1',
        shape: '4-2-3-1',
        style: 'BALANCED',
        unlockTier: 'STARTER',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '68%', left: '20%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '68%', left: '80%', role: 'DEF' },
            { id: 'LDM', top: '58%', left: '40%', role: 'MID' },
            { id: 'RDM', top: '58%', left: '60%', role: 'MID' },
            { id: 'LAM', top: '42%', left: '32%', role: 'MID' },
            { id: 'CAM', top: '40%', left: '50%', role: 'MID' },
            { id: 'RAM', top: '42%', left: '68%', role: 'MID' },
            { id: 'ST', top: '25%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '4222_ATTACK',
        label: '4-2-2-2',
        shape: '4-2-2-2',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '68%', left: '18%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '68%', left: '82%', role: 'DEF' },
            { id: 'LDM', top: '58%', left: '40%', role: 'MID' },
            { id: 'RDM', top: '58%', left: '60%', role: 'MID' },
            { id: 'LAM', top: '42%', left: '38%', role: 'MID' },
            { id: 'RAM', top: '42%', left: '62%', role: 'MID' },
            { id: 'STL', top: '25%', left: '42%', role: 'FWD' },
            { id: 'STR', top: '25%', left: '58%', role: 'FWD' }
        ]
    },
    {
        id: '442_BALANCED',
        label: '4-4-2',
        shape: '4-4-2',
        style: 'BALANCED',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '70%', left: '20%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '70%', left: '80%', role: 'DEF' },
            { id: 'LM', top: '52%', left: '25%', role: 'MID' },
            { id: 'LCM', top: '52%', left: '42%', role: 'MID' },
            { id: 'RCM', top: '52%', left: '58%', role: 'MID' },
            { id: 'RM', top: '52%', left: '75%', role: 'MID' },
            { id: 'STL', top: '30%', left: '44%', role: 'FWD' },
            { id: 'STR', top: '30%', left: '56%', role: 'FWD' }
        ]
    },
    {
        id: '442_DEF',
        label: '4-4-2 Def',
        shape: '4-4-2',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LB', top: '74%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '76%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '76%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '74%', left: '78%', role: 'DEF' },
            { id: 'LM', top: '58%', left: '26%', role: 'MID' },
            { id: 'LCM', top: '58%', left: '44%', role: 'MID' },
            { id: 'RCM', top: '58%', left: '56%', role: 'MID' },
            { id: 'RM', top: '58%', left: '74%', role: 'MID' },
            { id: 'STL', top: '36%', left: '46%', role: 'FWD' },
            { id: 'STR', top: '36%', left: '54%', role: 'FWD' }
        ]
    },
    {
        id: '352_BALANCED',
        label: '3-5-2',
        shape: '3-5-2',
        style: 'BALANCED',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '72%', left: '35%', role: 'DEF' },
            { id: 'CB', top: '74%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '65%', role: 'DEF' },
            { id: 'LM', top: '54%', left: '25%', role: 'MID' },
            { id: 'LDM', top: '56%', left: '40%', role: 'MID' },
            { id: 'RDM', top: '56%', left: '60%', role: 'MID' },
            { id: 'RM', top: '54%', left: '75%', role: 'MID' },
            { id: 'CAM', top: '42%', left: '50%', role: 'MID' },
            { id: 'STL', top: '26%', left: '44%', role: 'FWD' },
            { id: 'STR', top: '26%', left: '56%', role: 'FWD' }
        ]
    },
    {
        id: '343_ATTACK',
        label: '3-4-3',
        shape: '3-4-3',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '72%', left: '36%', role: 'DEF' },
            { id: 'CB', top: '74%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '64%', role: 'DEF' },
            { id: 'LM', top: '54%', left: '28%', role: 'MID' },
            { id: 'LCM', top: '52%', left: '42%', role: 'MID' },
            { id: 'RCM', top: '52%', left: '58%', role: 'MID' },
            { id: 'RM', top: '54%', left: '72%', role: 'MID' },
            { id: 'LW', top: '26%', left: '24%', role: 'FWD' },
            { id: 'ST', top: '22%', left: '50%', role: 'FWD' },
            { id: 'RW', top: '26%', left: '76%', role: 'FWD' }
        ]
    },
    {
        id: '4141_DEF',
        label: '4-1-4-1',
        shape: '4-1-4-1',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LB', top: '72%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '74%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '74%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '72%', left: '78%', role: 'DEF' },
            { id: 'DM', top: '62%', left: '50%', role: 'MID' },
            { id: 'LM', top: '52%', left: '26%', role: 'MID' },
            { id: 'LCM', top: '50%', left: '40%', role: 'MID' },
            { id: 'RCM', top: '50%', left: '60%', role: 'MID' },
            { id: 'RM', top: '52%', left: '74%', role: 'MID' },
            { id: 'ST', top: '28%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '451_DEF',
        label: '4-5-1',
        shape: '4-5-1',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LB', top: '72%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '74%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '74%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '72%', left: '78%', role: 'DEF' },
            { id: 'LM', top: '52%', left: '24%', role: 'MID' },
            { id: 'LCM', top: '52%', left: '36%', role: 'MID' },
            { id: 'CM', top: '50%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '52%', left: '64%', role: 'MID' },
            { id: 'RM', top: '52%', left: '76%', role: 'MID' },
            { id: 'ST', top: '30%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '3412_ATTACK',
        label: '3-4-1-2',
        shape: '3-4-1-2',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '72%', left: '36%', role: 'DEF' },
            { id: 'CB', top: '74%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '64%', role: 'DEF' },
            { id: 'LM', top: '54%', left: '26%', role: 'MID' },
            { id: 'LDM', top: '56%', left: '42%', role: 'MID' },
            { id: 'RDM', top: '56%', left: '58%', role: 'MID' },
            { id: 'RM', top: '54%', left: '74%', role: 'MID' },
            { id: 'CAM', top: '40%', left: '50%', role: 'MID' },
            { id: 'STL', top: '24%', left: '46%', role: 'FWD' },
            { id: 'STR', top: '24%', left: '54%', role: 'FWD' }
        ]
    },
    {
        id: '4321_ATTACK',
        label: '4-3-2-1',
        shape: '4-3-2-1',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '70%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '70%', left: '78%', role: 'DEF' },
            { id: 'LCM', top: '54%', left: '40%', role: 'MID' },
            { id: 'CM', top: '52%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '54%', left: '60%', role: 'MID' },
            { id: 'LF', top: '34%', left: '44%', role: 'FWD' },
            { id: 'RF', top: '34%', left: '56%', role: 'FWD' },
            { id: 'ST', top: '24%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '451_ATTACK',
        label: '4-5-1 Attack',
        shape: '4-5-1',
        style: 'ATTACKING',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '70%', left: '22%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '38%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '62%', role: 'DEF' },
            { id: 'RB', top: '70%', left: '78%', role: 'DEF' },
            { id: 'LM', top: '50%', left: '26%', role: 'MID' },
            { id: 'LCM', top: '48%', left: '40%', role: 'MID' },
            { id: 'CAM', top: '44%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '48%', left: '60%', role: 'MID' },
            { id: 'RM', top: '50%', left: '74%', role: 'MID' },
            { id: 'ST', top: '26%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '532_DEF',
        label: '5-3-2',
        shape: '5-3-2',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LWB', top: '70%', left: '18%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '34%', role: 'DEF' },
            { id: 'CB', top: '74%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '66%', role: 'DEF' },
            { id: 'RWB', top: '70%', left: '82%', role: 'DEF' },
            { id: 'LCM', top: '56%', left: '42%', role: 'MID' },
            { id: 'CM', top: '54%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '56%', left: '58%', role: 'MID' },
            { id: 'STL', top: '30%', left: '46%', role: 'FWD' },
            { id: 'STR', top: '30%', left: '54%', role: 'FWD' }
        ]
    },
    {
        id: '541_PARK',
        label: '5-4-1 Wall',
        shape: '5-4-1',
        style: 'DEFENSIVE',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '90%', left: '50%', role: 'GK' },
            { id: 'LWB', top: '74%', left: '18%', role: 'DEF' },
            { id: 'LCB', top: '76%', left: '34%', role: 'DEF' },
            { id: 'CB', top: '78%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '76%', left: '66%', role: 'DEF' },
            { id: 'RWB', top: '74%', left: '82%', role: 'DEF' },
            { id: 'LM', top: '58%', left: '26%', role: 'MID' },
            { id: 'LCM', top: '58%', left: '40%', role: 'MID' },
            { id: 'RCM', top: '58%', left: '60%', role: 'MID' },
            { id: 'RM', top: '58%', left: '74%', role: 'MID' },
            { id: 'ST', top: '34%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '3421_BALANCED',
        label: '3-4-2-1',
        shape: '3-4-2-1',
        style: 'BALANCED',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '72%', left: '36%', role: 'DEF' },
            { id: 'CB', top: '74%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '64%', role: 'DEF' },
            { id: 'LM', top: '54%', left: '28%', role: 'MID' },
            { id: 'LCM', top: '54%', left: '42%', role: 'MID' },
            { id: 'RCM', top: '54%', left: '58%', role: 'MID' },
            { id: 'RM', top: '54%', left: '72%', role: 'MID' },
            { id: 'LF', top: '34%', left: '44%', role: 'FWD' },
            { id: 'RF', top: '34%', left: '56%', role: 'FWD' },
            { id: 'ST', top: '24%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '352_DEF',
        label: '3-5-2 Def',
        shape: '3-5-2',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '74%', left: '36%', role: 'DEF' },
            { id: 'CB', top: '76%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '74%', left: '64%', role: 'DEF' },
            { id: 'LM', top: '58%', left: '26%', role: 'MID' },
            { id: 'LDM', top: '60%', left: '42%', role: 'MID' },
            { id: 'RDM', top: '60%', left: '58%', role: 'MID' },
            { id: 'RM', top: '58%', left: '74%', role: 'MID' },
            { id: 'CAM', top: '44%', left: '50%', role: 'MID' },
            { id: 'STL', top: '30%', left: '46%', role: 'FWD' },
            { id: 'STR', top: '30%', left: '54%', role: 'FWD' }
        ]
    },
    {
        id: '424_ATTACK',
        label: '4-2-4',
        shape: '4-2-4',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '70%', left: '20%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '70%', left: '80%', role: 'DEF' },
            { id: 'LDM', top: '58%', left: '42%', role: 'MID' },
            { id: 'RDM', top: '58%', left: '58%', role: 'MID' },
            { id: 'LW', top: '30%', left: '20%', role: 'FWD' },
            { id: 'STL', top: '26%', left: '40%', role: 'FWD' },
            { id: 'STR', top: '26%', left: '60%', role: 'FWD' },
            { id: 'RW', top: '30%', left: '80%', role: 'FWD' }
        ]
    },
    {
        id: '361_DEF',
        label: '3-6-1',
        shape: '3-6-1',
        style: 'DEFENSIVE',
        unlockTier: 'MARKET_MEDIUM',
        positions: [
            { id: 'GK', top: '88%', left: '50%', role: 'GK' },
            { id: 'LCB', top: '74%', left: '36%', role: 'DEF' },
            { id: 'CB', top: '76%', left: '50%', role: 'DEF' },
            { id: 'RCB', top: '74%', left: '64%', role: 'DEF' },
            { id: 'LM', top: '58%', left: '24%', role: 'MID' },
            { id: 'LCM', top: '58%', left: '36%', role: 'MID' },
            { id: 'CM', top: '56%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '58%', left: '64%', role: 'MID' },
            { id: 'RM', top: '58%', left: '76%', role: 'MID' },
            { id: 'CAM', top: '44%', left: '50%', role: 'MID' },
            { id: 'ST', top: '30%', left: '50%', role: 'FWD' }
        ]
    },
    {
        id: '433_WIDE',
        label: '4-3-3 Wide',
        shape: '4-3-3',
        style: 'ATTACKING',
        unlockTier: 'PREMIUM_SHOP',
        positions: [
            { id: 'GK', top: '86%', left: '50%', role: 'GK' },
            { id: 'LB', top: '68%', left: '18%', role: 'DEF' },
            { id: 'LCB', top: '72%', left: '40%', role: 'DEF' },
            { id: 'RCB', top: '72%', left: '60%', role: 'DEF' },
            { id: 'RB', top: '68%', left: '82%', role: 'DEF' },
            { id: 'LCM', top: '52%', left: '38%', role: 'MID' },
            { id: 'CM', top: '50%', left: '50%', role: 'MID' },
            { id: 'RCM', top: '52%', left: '62%', role: 'MID' },
            { id: 'LW', top: '20%', left: '18%', role: 'FWD' },
            { id: 'ST', top: '22%', left: '50%', role: 'FWD' },
            { id: 'RW', top: '20%', left: '82%', role: 'FWD' }
        ]
    }
];

const BADGES: SquadBadge[] = [
    {
        id: 'FOUNDATION_XI',
        label: 'Foundations XI',
        description: 'Full starting XI grants a small all-round boost.',
        type: 'BALANCED',
        attackBonus: 1,
        midfieldBonus: 1,
        defenseBonus: 1,
        requirement: 'FOUNDATION_XI'
    },
    {
        id: 'WING_SYNERGY',
        label: 'Wing Synergy',
        description: 'Fast wingers with creative mids boost attacking threat.',
        type: 'ATTACK',
        attackBonus: 2,
        midfieldBonus: 1,
        defenseBonus: 0,
        requirement: 'SYNERGY_PAIR'
    },
    {
        id: 'DEEP_SQUAD',
        label: 'Deep Squad',
        description: 'Larger roster improves depth and stability.',
        type: 'DEFENSE',
        attackBonus: 0,
        midfieldBonus: 1,
        defenseBonus: 2,
        requirement: 'DEPTH_18'
    }
];

const CHALLENGES: SquadChallenge[] = [
    {
        id: 'CHALLENGE_FOUNDATIONS',
        label: 'Foundations Ready',
        description: 'Fill all 11 starting slots with players.',
        requirement: 'FOUNDATION_XI'
    },
    {
        id: 'CHALLENGE_WING_PLAY',
        label: 'Wing Play Online',
        description: 'Activate at least one fast winger and creative mid link.',
        requirement: 'SYNERGY_PAIR'
    },
    {
        id: 'CHALLENGE_HOMEGROWN',
        label: 'Homegrown Core',
        description: 'Field a starting XI made entirely of Standard cards.',
        requirement: 'STANDARD_ONLY'
    }
];

const mapPositionToRole = (position: string): FormationSlot['role'] => {
    const pos = position.toUpperCase();
    if (pos === 'GK') return 'GK';
    if (pos === 'CB' || pos === 'RB' || pos === 'LB' || pos === 'RWB' || pos === 'LWB') {
        return 'DEF';
    }
    if (pos === 'DMF' || pos === 'CMF' || pos === 'AMF' || pos === 'RMF' || pos === 'LMF' || pos === 'DM' || pos === 'CM' || pos === 'CAM') {
        return 'MID';
    }
    return 'FWD';
};

const isWideAttackerPosition = (position: string) => {
    const pos = position.toUpperCase();
    return pos === 'LWF' || pos === 'RWF' || pos === 'LW' || pos === 'RW' || pos === 'LMF' || pos === 'RMF';
};

const isCreativeMidPosition = (position: string) => {
    const pos = position.toUpperCase();
    return pos === 'CMF' || pos === 'AMF' || pos === 'CM' || pos === 'CAM' || pos === 'RMF' || pos === 'LMF' || pos === 'DMF' || pos === 'DM';
};

const isBadgeUnlocked = (
    badge: SquadBadge,
    ctx: { hasFullXI: boolean; synergyPairs: number; rosterSize: number }
) => {
    if (badge.requirement === 'FOUNDATION_XI') {
        return ctx.hasFullXI;
    }
    if (badge.requirement === 'SYNERGY_PAIR') {
        return ctx.synergyPairs >= 1;
    }
    if (badge.requirement === 'DEPTH_18') {
        return ctx.rosterSize >= 18;
    }
    return false;
};

const isChallengeComplete = (
    challenge: SquadChallenge,
    ctx: { hasFullXI: boolean; synergyPairs: number; allStandardXI: boolean }
) => {
    if (challenge.requirement === 'FOUNDATION_XI') {
        return ctx.hasFullXI;
    }
    if (challenge.requirement === 'SYNERGY_PAIR') {
        return ctx.synergyPairs >= 1;
    }
    if (challenge.requirement === 'STANDARD_ONLY') {
        return ctx.allStandardXI;
    }
    return false;
};

export const SquadManagement: React.FC<{ onNavigate?: (panel: string) => void }> = ({ onNavigate }) => {
    const { user, removeFromSquad, swapSquadPlayers, setFormation, equipBadge, autoPickSquad } = useAuthStore();
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const [selectedBenchId, setSelectedBenchId] = useState<string | null>(null);
    const [positionFilter, setPositionFilter] = useState<'ALL' | 'GK' | 'DEF' | 'MID' | 'FWD'>('ALL');
    const [ovrFilter, setOvrFilter] = useState<string>('ALL');

    const STARTER_IDS = [
        'PLAYER_001', 'PLAYER_002', 'PLAYER_003', 'PLAYER_004', 'PLAYER_005',
        'PLAYER_006', 'PLAYER_007', 'PLAYER_008', 'PLAYER_009', 'PLAYER_010', 'PLAYER_011'
    ];

    // Respect the order of IDs in user.squad for manual positioning
    const fullSquad = useMemo(() => {
        return (user?.squad.map(id => players.find(p => p.id === id)).filter(p => p !== undefined) || []) as typeof players;
    }, [user?.squad]);

    const startingXI = fullSquad.slice(0, 11);
    const bench = fullSquad.slice(11);

    const getBestSquadLineup = () => {
        // This is used only for Auto Pick functionality
        const list = [...fullSquad];
        if (!list.length) return [];
        
        const gks = list.filter(p => p.position === 'GK');
        const fieldPlayers = list.filter(p => p.position !== 'GK');
        const sortedGks = [...gks].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        const sortedField = [...fieldPlayers].sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
        
        const bestIds: string[] = [];
        if (sortedGks.length > 0) bestIds.push(sortedGks[0].id);
        
        for (const p of sortedField) {
            if (bestIds.length >= 11) break;
            bestIds.push(p.id);
        }
        return bestIds;
    };

    const handleAutoPick = () => {
        const bestIds = getBestSquadLineup();
        if (bestIds.length > 0) {
            autoPickSquad(bestIds);
        }
    };

    const rosterSorted = useMemo(() => {
        const list = [...fullSquad];
        return list.sort((a, b) => (b.ovr || 0) - (a.ovr || 0));
    }, [fullSquad]);

    const currentFormation = useMemo(() => {
        const found = FORMATIONS.find(f => f.id === (user?.selectedFormationId || '433_BALANCED'));
        return found || FORMATIONS[0];
    }, [user?.selectedFormationId]);

    const teamOvr = startingXI.length
        ? Math.round(startingXI.reduce((acc, p) => acc + (p?.ovr || 0), 0) / startingXI.length)
        : 0;

    const startingIds = new Set(startingXI.map(p => p.id));
    const benchIds = new Set(bench.map(p => p.id));

    const filteredRoster = useMemo(() => {
        let list = rosterSorted;
        if (positionFilter !== 'ALL') {
            list = list.filter(p => mapPositionToRole(String(p.position || '')) === positionFilter);
        }
        if (ovrFilter !== 'ALL') {
            const min = parseInt(ovrFilter, 10);
            if (!Number.isNaN(min)) {
                list = list.filter(p => (p.ovr || 0) >= min);
            }
        }
        return list;
    }, [rosterSorted, positionFilter, ovrFilter]);

    let attackBase = 0;
    let midfieldBase = 0;
    let defenseBase = 0;
    let ratingCount = 0;
    let fastWingers = 0;
    let creativeMids = 0;
    let allStandardXI = true;
    let staminaTotal = 0;
    let staminaLowProfiles = 0;
    let gkCount = 0;
    let defCount = 0;
    let midCount = 0;
    let fwdCount = 0;

    if (startingXI.length) {
        const list = startingXI as any[];
        for (const p of list) {
            if (!p) {
                continue;
            }
            const stats = p.stats || {};
            const position = String(p.position || '');
            const speed = Number(stats.speed || 0);
            const shooting = Number(stats.shooting || 0);
            const passing = Number(stats.passing || 0);
            const defense = Number(stats.defense || 0);
            attackBase += shooting;
            midfieldBase += passing;
            defenseBase += defense;
            ratingCount += 1;
            const staminaStat = Number((stats as any).stamina || 60);
            staminaTotal += staminaStat;
            if (staminaStat < 60) {
                staminaLowProfiles += 1;
            }
            const role = mapPositionToRole(position);
            if (role === 'GK') {
                gkCount += 1;
            } else if (role === 'DEF') {
                defCount += 1;
            } else if (role === 'MID') {
                midCount += 1;
            } else if (role === 'FWD') {
                fwdCount += 1;
            }
            if (isWideAttackerPosition(position) && speed >= 68) {
                fastWingers += 1;
            }
            if (isCreativeMidPosition(position) && passing >= 65) {
                creativeMids += 1;
            }
            if (String(p.rarity || '') !== 'Standard') {
                allStandardXI = false;
            }
        }
    }

    const synergyPairs = Math.min(fastWingers, creativeMids);
    const synergyBoost = synergyPairs * 2;

    let squadLevelLabel = 'Foundations';
    let levelBonus = 0;
    if (teamOvr >= 80) {
        squadLevelLabel = 'Elite';
        levelBonus = 4;
    } else if (teamOvr >= 70) {
        squadLevelLabel = 'Pro';
        levelBonus = 2;
    }

    const badgeContext = {
        hasFullXI: startingXI.length === 11,
        synergyPairs,
        rosterSize: fullSquad.length
    };

    const badgesWithState = BADGES.map(badge => {
        const unlocked = isBadgeUnlocked(badge, badgeContext);
        const active = unlocked && user?.equippedBadgeId === badge.id;
        return { badge, unlocked, active };
    });

    const activeBadge = badgesWithState.find(b => b.active)?.badge || null;

    let attackRating = 0;
    let midfieldRating = 0;
    let defenseRating = 0;

    if (ratingCount > 0) {
        attackRating = Math.round(
            attackBase / ratingCount + synergyBoost + levelBonus + (activeBadge ? activeBadge.attackBonus : 0)
        );
        midfieldRating = Math.round(
            midfieldBase / ratingCount + levelBonus + (activeBadge ? activeBadge.midfieldBonus : 0)
        );
        defenseRating = Math.round(
            defenseBase / ratingCount + levelBonus + (activeBadge ? activeBadge.defenseBonus : 0)
        );
    }

    const avgAttack = ratingCount > 0 ? attackBase / ratingCount : 0;
    const avgMidfield = ratingCount > 0 ? midfieldBase / ratingCount : 0;
    const avgDefense = ratingCount > 0 ? defenseBase / ratingCount : 0;
    const avgStaminaStat = ratingCount > 0 ? Math.round(staminaTotal / ratingCount) : 0;

    let squadIdentity: 'Balanced' | 'Pressing' | 'Possession' | 'Counter' = 'Balanced';
    let squadIdentitySubtitle = 'Well-rounded base squad.';

    if (avgDefense >= avgAttack && currentFormation.style === 'ATTACKING') {
        squadIdentity = 'Pressing';
        squadIdentitySubtitle = 'Front-foot defending and high pressure.';
    } else if (avgMidfield >= avgAttack + 4) {
        squadIdentity = 'Possession';
        squadIdentitySubtitle = 'Midfield control and safer tempo.';
    } else if (fastWingers >= 2 && creativeMids >= 1) {
        squadIdentity = 'Counter';
        squadIdentitySubtitle = 'Quick transitions and wide breaks.';
    } else if (currentFormation.style === 'DEFENSIVE') {
        squadIdentity = 'Balanced';
        squadIdentitySubtitle = 'Compact and risk-aware shape.';
    }

    const validationIssues: string[] = [];
    if (gkCount === 0) validationIssues.push('No goalkeeper');
    if (defCount < 3) validationIssues.push('Low defence coverage');
    if (midCount < 2) validationIssues.push('Thin midfield');
    if (fwdCount === 0) validationIssues.push('No forwards');
    const validationSummary = validationIssues.length === 0 ? 'Match ready' : validationIssues.join(' • ');

    const challengesWithState = CHALLENGES.map(challenge => {
        const completed = isChallengeComplete(challenge, {
            hasFullXI: startingXI.length === 11,
            synergyPairs,
            allStandardXI
        });
        return { challenge, completed };
    });

    const handlePlayerClick = (index: number) => {
        if (!user) return;
        const starter = startingXI[index];
        if (!starter) return;
        if (selectedBenchId) {
            const fromId = selectedBenchId;
            const toId = starter.id;
            setSelectedBenchId(null);
            setSelectedSlot(null);
            swapSquadPlayers(fromId, toId);
            return;
        }
        if (selectedSlot === index) {
            setSelectedSlot(null);
        } else {
            setSelectedSlot(index);
        }
    };

    const getRarityColor = (rarity?: string) => {
        switch (rarity) {
            case 'Premium Legend':
                return 'border-yellow-300 bg-gradient-to-br from-black via-yellow-900 to-yellow-700 shadow-[0_0_25px_rgba(250,204,21,0.9)]';
            case 'Premium':
                return 'border-yellow-200 bg-gradient-to-br from-yellow-900 via-yellow-700 to-amber-500 shadow-[0_0_20px_rgba(253,224,71,0.7)]';
            case 'Legendary':
                return 'border-amber-300 bg-gradient-to-br from-amber-900 via-amber-700 to-yellow-500 shadow-[0_0_18px_rgba(252,211,77,0.6)]';
            case 'Iconic':
                return 'border-red-400 bg-gradient-to-br from-black via-red-900 to-yellow-600 shadow-[0_0_16px_rgba(248,113,113,0.7)]';
            case 'Epic':
                return 'border-purple-400 bg-gradient-to-br from-purple-900 via-purple-700 to-fuchsia-500 shadow-[0_0_16px_rgba(196,181,253,0.7)]';
            case 'Rare':
                return 'border-yellow-300 bg-gradient-to-br from-blue-900 via-indigo-800 to-yellow-500 shadow-[0_0_12px_rgba(129,212,250,0.6)]';
            case 'Standard':
            default:
                return 'border-gray-400 bg-gradient-to-br from-slate-800 via-slate-900 to-black';
        }
    };

    const getPlayerStaminaStat = (player: any) => {
        if (!player) return 0;
        const stats = (player.stats || {}) as any;
        const value = typeof stats.stamina === 'number' ? stats.stamina : 60;
        return value;
    };

    // duplicate removed

    return (
        <div className="w-full h-full bg-gray-900 flex flex-col md:flex-row">
            <div className="flex-1 relative bg-green-800 m-4 rounded-xl border-4 border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <div className="w-full h-1/2 border-b-2 border-white"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white rounded-full"></div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 border-b-2 border-x-2 border-white"></div>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-24 border-t-2 border-x-2 border-white"></div>
                </div>

                <div className="absolute top-4 left-4 bg-black/50 p-2 rounded text-white z-10">
                    <div className="text-xs text-gray-400 uppercase">Team OVR</div>
                    <div className="text-3xl font-black">{teamOvr}</div>
                    <div className="mt-1 flex gap-2 text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-600/40 border border-emerald-400/60">
                            ATK {attackRating || 0}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-sky-600/40 border border-sky-400/60">
                            MID {midfieldRating || 0}
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-indigo-600/40 border border-indigo-400/60">
                            DEF {defenseRating || 0}
                        </span>
                    </div>
                    <div className="mt-1 text-[10px] text-yellow-300">
                        {squadLevelLabel} Squad
                    </div>
                    {synergyPairs > 0 && (
                        <div className="mt-1 text-[10px] text-emerald-300">
                            Synergy active: {synergyPairs} link{synergyPairs > 1 ? 's' : ''}
                        </div>
                    )}
                    <div className="mt-1 text-[10px] text-sky-200">
                        Identity: {squadIdentity}
                    </div>
                    <div className="text-[9px] text-slate-200/80 max-w-[180px]">
                        {squadIdentitySubtitle}
                    </div>
                    <button 
                        onClick={handleAutoPick}
                        className="mt-2 w-full py-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold transition-colors shadow-lg border border-emerald-400"
                    >
                        Auto Pick Best XI
                    </button>
                </div>

                {currentFormation.positions.map((pos, index) => {
                    const player = startingXI[index];
                    if (!player) return null;
                    const kit = getKitForPlayer(player.id);
                    const staminaStat = getPlayerStaminaStat(player);

                    return (
                        <div 
                            key={index}
                            onClick={() => handlePlayerClick(index)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-110 flex flex-col items-center group`}
                            style={{ top: pos.top, left: pos.left }}
                        >
                            <div className={`rounded-full border-2 flex items-center justify-center shadow-lg relative ${getRarityColor(player.rarity)} ${selectedSlot === index ? 'ring-4 ring-white' : ''}`}>
                                <PlayerFace playerId={player.id} size="md" />
                                <div className="absolute -top-2 -right-2 bg-black text-white text-[10px] font-bold px-1 rounded border border-white">
                                    {player.ovr}
                                </div>
                            </div>
                            <div className="mt-1 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white font-bold truncate max-w-[80px] text-center border border-white/20 group-hover:bg-black">
                                {player.name}
                            </div>
                            <div className="text-[9px] font-mono text-cyan-300 bg-black/50 px-1 rounded mt-0.5">
                                {kit.country}
                            </div>
                            <div className="text-[9px] font-mono text-yellow-400 bg-black/50 px-1 rounded mt-0.5">
                                {pos.id}
                            </div>
                            <div className="text-[9px] font-mono text-emerald-300 bg-black/50 px-1 rounded mt-0.5">
                                STA {staminaStat}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="w-full md:w-80 bg-gray-800 p-4 border-l border-gray-700 overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>🧠</span> Squad HQ
                </h2>

                <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-gray-200">
                    <div className="bg-gray-700/70 rounded p-2 border border-gray-600">
                        <div className="text-[10px] uppercase text-gray-400">Roster</div>
                        <div className="text-lg font-bold">{fullSquad.length}</div>
                        <div className="text-[10px] text-gray-300 mt-0.5">
                            Owned players
                        </div>
                    </div>
                    <div className="bg-gray-700/70 rounded p-2 border border-gray-600">
                        <div className="text-[10px] uppercase text-gray-400">Active Squad</div>
                        <div className="text-xs">
                            XI {startingXI.length} • Bench {bench.length}
                        </div>
                        <div className="text-[10px] text-gray-300 mt-0.5">
                            {currentFormation.label}
                        </div>
                    </div>
                    <div className="bg-gray-700/70 rounded p-2 border border-emerald-500/60">
                        <div className="text-[10px] uppercase text-emerald-300">Training Points</div>
                        <div className="text-lg font-bold text-emerald-200">{user?.trainingPoints ?? 0}</div>
                        <div className="text-[10px] text-emerald-400 mt-0.5">
                            Used for upgrades in Training
                        </div>
                    </div>
                    <div className="bg-gray-700/70 rounded p-2 border border-gray-600">
                        <div className="text-[10px] uppercase text-gray-400">Stamina Profile</div>
                        <div className="text-lg font-bold">
                            {avgStaminaStat || '--'}
                        </div>
                        <div className="text-[10px] text-gray-300 mt-0.5">
                            {staminaLowProfiles > 0 ? `${staminaLowProfiles} low-stamina starters` : 'Rotation ready'}
                        </div>
                    </div>
                </div>

                <div className="mb-4 text-[11px] text-gray-300">
                    <span className="uppercase tracking-widest text-gray-400 mr-1">Validation</span>
                    <span className={validationIssues.length === 0 ? 'text-emerald-300' : 'text-amber-300'}>
                        {validationSummary}
                    </span>
                </div>

                {onNavigate && (
                    <button 
                        onClick={() => onNavigate('TRAINING_HUB')}
                        className="w-full mb-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold transition-colors flex items-center justify-center gap-2 shadow-lg"
                    >
                        <span className="material-icons">fitness_center</span>
                        <span>Go to Training</span>
                    </button>
                )}

                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>📋</span> Formations
                </h2>

                <div className="mb-4 grid grid-cols-2 gap-2">
                    {FORMATIONS.map(f => {
                        const isStarter = f.unlockTier === 'STARTER';
                        const locked = !isStarter;
                        const active = f.id === currentFormation.id;
                        return (
                            <button
                                key={f.id}
                                disabled={locked}
                                onClick={() => setFormation(f.id)}
                                className={[
                                    'px-2 py-1 rounded text-[10px] font-bold border',
                                    active ? 'bg-emerald-500 text-black border-emerald-300' : 'bg-gray-700 text-gray-200 border-gray-600',
                                    locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-600'
                                ].join(' ')}
                            >
                                <div>{f.label}</div>
                                <div className="text-[9px] text-gray-300">
                                    {f.style === 'ATTACKING' ? 'Attacking' : f.style === 'DEFENSIVE' ? 'Defensive' : 'Balanced'}
                                </div>
                                <div className="text-[9px] text-yellow-300">
                                    {f.unlockTier === 'STARTER' ? 'Starter' : f.unlockTier === 'PREMIUM_SHOP' ? 'Premium Shop' : 'Market'}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                    <span>👟</span> RESERVES
                </h2>
                {selectedBenchId && selectedSlot !== null && startingXI[selectedSlot] && (
                    <div className="mb-3 text-[11px] text-amber-300 bg-amber-900/40 border border-amber-500/60 rounded px-2 py-1">
                        Swap <span className="font-bold">{bench.find(b => b.id === selectedBenchId)?.name}</span> ↔{' '}
                        <span className="font-bold">{startingXI[selectedSlot].name}</span> — tap either to confirm.
                    </div>
                )}

                <div className="space-y-2">
                    {bench.map((player) => {
                        const kit = getKitForPlayer(player.id);
                        const staminaStat = getPlayerStaminaStat(player as any);
                        return (
                        <div 
                            key={player.id}
                            onClick={() => {
                                if (selectedBenchId === player.id) {
                                    setSelectedBenchId(null);
                                } else {
                                    setSelectedBenchId(player.id);
                                }
                            }}
                            className={`flex items-center gap-3 p-2 rounded bg-gray-700 hover:bg-gray-600 cursor-pointer border-l-4 ${getRarityColor(player.rarity).split(' ')[0]} ${selectedBenchId === player.id ? 'ring-2 ring-emerald-400' : ''}`}
                        >
                            <PlayerFace playerId={player.id} size="sm" />
                            <div className="flex-1">
                                <div className="text-sm font-bold text-white">{player.name}</div>
                                <div className="text-xs text-gray-400">{player.position} | OVR: {player.ovr}</div>
                                <div className="text-[10px] text-cyan-300">{kit.country}</div>
                                <div className="text-[10px] text-emerald-300">
                                    STA {staminaStat}
                                </div>
                                {Array.isArray((player as any).skills) && (player as any).skills.length > 0 && (
                                    <div className="text-[10px] text-emerald-300 truncate">
                                        {(player as any).skills.slice(0, 2).join(' • ')}
                                    </div>
                                )}
                            </div>
                            {STARTER_IDS.includes(player.id) ? (
                                <div className="text-[10px] text-gray-400 uppercase tracking-wider">
                                    Starter
                                </div>
                            ) : (
                                <button
                                    onClick={() => removeFromSquad(player.id)}
                                    className="text-[10px] px-2 py-1 rounded border border-red-500/50 text-red-400 hover:bg-red-500/10"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                    )})}

                    {bench.length === 0 && (
                        <div className="text-gray-500 text-center py-8">
                            No reserves available.
                            <br/>
                            <span className="text-xs">Buy packs to expand your squad!</span>
                        </div>
                    )}
                </div>

                <h2 className="text-xl font-bold text-white mt-5 mb-2 flex items-center gap-2">
                    <span>🎴</span> Team Badges
                </h2>
                <div className="space-y-2 mb-4">
                    {badgesWithState.map(({ badge, unlocked, active }) => (
                        <button
                            key={badge.id}
                            type="button"
                            disabled={!unlocked}
                            onClick={() => {
                                if (!unlocked) return;
                                if (active) {
                                    equipBadge('');
                                } else {
                                    equipBadge(badge.id);
                                }
                            }}
                            className={[
                                'w-full text-left p-2 rounded border text-xs transition-colors',
                                active
                                    ? 'bg-emerald-600/60 border-emerald-400 text-black'
                                    : unlocked
                                        ? 'bg-gray-700 border-gray-500 text-gray-100 hover:bg-gray-600'
                                        : 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed'
                            ].join(' ')}
                        >
                            <div className="flex items-center justify-between mb-0.5">
                                <div className="font-bold">{badge.label}</div>
                                <div className="text-[10px] uppercase text-yellow-300">
                                    {badge.type}
                                </div>
                            </div>
                            <div className="text-[11px] text-gray-200">{badge.description}</div>
                            <div className="mt-1 text-[10px] text-emerald-300">
                                +ATK {badge.attackBonus} | +MID {badge.midfieldBonus} | +DEF {badge.defenseBonus}
                            </div>
                            {!unlocked && (
                                <div className="mt-1 text-[10px] text-red-300">
                                    Locked – complete its condition in your XI.
                                </div>
                            )}
                            {active && (
                                <div className="mt-1 text-[10px] text-black">
                                    Equipped
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>📚</span> Squad Challenges
                </h2>
                <div className="space-y-2 mb-4">
                    {challengesWithState.map(({ challenge, completed }) => (
                        <div
                            key={challenge.id}
                            className={[
                                'p-2 rounded border text-xs',
                                completed
                                    ? 'bg-emerald-700/40 border-emerald-400 text-emerald-100'
                                    : 'bg-gray-700 border-gray-600 text-gray-100'
                            ].join(' ')}
                        >
                            <div className="flex items-center justify-between mb-0.5">
                                <div className="font-bold">{challenge.label}</div>
                                <div className="text-[10px] uppercase">
                                    {completed ? 'Completed' : 'In Progress'}
                                </div>
                            </div>
                            <div className="text-[11px] text-gray-200">
                                {challenge.description}
                            </div>
                        </div>
                    ))}
                </div>

                <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <span>📦</span> Club Roster
                </h2>
                <div className="flex items-center gap-2 mb-2 text-[11px]">
                    <div className="flex-1">
                        <div className="text-gray-400 mb-0.5">Role</div>
                        <select
                            className="w-full bg-gray-900 border border-gray-600 rounded px-1.5 py-1 text-xs text-gray-100"
                            value={positionFilter}
                            onChange={(e) => setPositionFilter(e.target.value as any)}
                        >
                            <option value="ALL">All</option>
                            <option value="GK">GK</option>
                            <option value="DEF">DEF</option>
                            <option value="MID">MID</option>
                            <option value="FWD">FWD</option>
                        </select>
                    </div>
                    <div className="flex-1">
                        <div className="text-gray-400 mb-0.5">Min OVR</div>
                        <select
                            className="w-full bg-gray-900 border border-gray-600 rounded px-1.5 py-1 text-xs text-gray-100"
                            value={ovrFilter}
                            onChange={(e) => setOvrFilter(e.target.value)}
                        >
                            <option value="ALL">Any</option>
                            <option value="60">60+</option>
                            <option value="65">65+</option>
                            <option value="70">70+</option>
                            <option value="75">75+</option>
                            <option value="80">80+</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-1">
                    {filteredRoster.map((player) => {
                        const kit = getKitForPlayer(player.id);
                        const inXI = startingIds.has(player.id);
                        const inBench = benchIds.has(player.id);
                        return (
                            <div
                                key={player.id}
                                className={[
                                    'flex items-center gap-2 p-2 rounded border bg-gray-700',
                                    inXI
                                        ? 'border-emerald-400'
                                        : inBench
                                            ? 'border-sky-400'
                                            : 'border-gray-600'
                                ].join(' ')}
                            >
                                <PlayerFace playerId={player.id} size="sm" />
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-white">
                                            {player.name}
                                        </div>
                                        <div className="text-[10px] text-yellow-300">
                                            OVR {player.ovr}
                                        </div>
                                    </div>
                                    <div className="text-[10px] text-gray-300">
                                        {player.position} • {kit.country}
                                    </div>
                                    {Array.isArray((player as any).skills) && (player as any).skills.length > 0 && (
                                        <div className="text-[10px] text-emerald-300 truncate">
                                            {(player as any).skills.slice(0, 2).join(' • ')}
                                        </div>
                                    )}
                                </div>
                                <div className="text-[10px] text-gray-300">
                                    {inXI ? 'XI' : inBench ? 'Bench' : 'Club'}
                                </div>
                            </div>
                        );
                    })}

                    {filteredRoster.length === 0 && (
                        <div className="text-gray-500 text-center py-4 text-xs">
                            No players match these filters.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
