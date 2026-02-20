import fs from 'fs';
import path from 'path';

const OUTPUT_PATH = path.join(process.cwd(), 'src', 'data', 'players.json');

// --- CONSTANTS ---
const FIRST_NAMES = ['Kai', 'Jaxon', 'Zane', 'Ryker', 'Daxton', 'Kael', 'Orion', 'Pax', 'Neo', 'Zion', 'Axel', 'Rocco', 'Knox', 'Maddox', 'Jett', 'Nova', 'Phoenix', 'River', 'Titan', 'Atlas', 'Cade', 'Nash', 'Rex', 'Viggo', 'Dante', 'Enzo', 'Kian', 'Remy', 'Zade', 'Jace'];
const LAST_NAMES = ['Voss', 'Drax', 'Kovacs', 'Mercer', 'Steel', 'Wolf', 'Rane', 'Blaze', 'Frost', 'Storm', 'Hawk', 'Drake', 'Thorne', 'Cross', 'Banks', 'King', 'Prince', 'Duke', 'Baron', 'Knight', 'Sterling', 'Stone', 'Wilder', 'Power', 'Stark', 'Vane', 'Rook', 'Gage', 'Volt', 'Mace'];

// --- PREDEFINED PLAYERS (201-250) ---
const PREDEFINED = {
    // --- STARTER 11 (1-11) ---
    1: { name: "Alen Krovas", pos: "GK", rarity: "Standard", ovr: 62, stats: { gk_diving: 64, gk_reflexes: 63, gk_handling: 60, gk_positioning: 61, gk_kicking: 58, physical: 66, stamina: 55 } },
    2: { name: "Riko Valdan", pos: "RB", rarity: "Standard", ovr: 60, stats: { speed: 64, shooting: 45, passing: 56, ball_control: 57, dribbling: 55, defense: 60, physical: 62, stamina: 65 } },
    3: { name: "Maron Hexel", pos: "CB", rarity: "Standard", ovr: 61, stats: { speed: 55, shooting: 42, passing: 54, ball_control: 52, dribbling: 50, defense: 64, physical: 68, stamina: 63 } },
    4: { name: "Trevon Silas", pos: "CB", rarity: "Standard", ovr: 62, stats: { speed: 56, shooting: 43, passing: 55, ball_control: 53, dribbling: 51, defense: 65, physical: 69, stamina: 64 } },
    5: { name: "Lio Kendrix", pos: "LB", rarity: "Standard", ovr: 60, stats: { speed: 63, shooting: 44, passing: 56, ball_control: 56, dribbling: 54, defense: 61, physical: 61, stamina: 66 } },
    6: { name: "Nexo Barin", pos: "DMF", rarity: "Standard", ovr: 63, stats: { speed: 58, shooting: 50, passing: 60, ball_control: 59, dribbling: 57, defense: 64, physical: 66, stamina: 68 } },
    7: { name: "Arvid Molner", pos: "CMF", rarity: "Standard", ovr: 64, stats: { speed: 61, shooting: 54, passing: 64, ball_control: 63, dribbling: 61, defense: 58, physical: 60, stamina: 69 } },
    8: { name: "Cairo Venn", pos: "AMF", rarity: "Standard", ovr: 65, stats: { speed: 63, shooting: 62, passing: 66, ball_control: 67, dribbling: 68, defense: 52, physical: 58, stamina: 67 } },
    9: { name: "Zayn Morato", pos: "RWF", rarity: "Standard", ovr: 64, stats: { speed: 70, shooting: 60, passing: 58, ball_control: 64, dribbling: 66, defense: 48, physical: 57, stamina: 68 } },
    10: { name: "Eron Falco", pos: "LWF", rarity: "Standard", ovr: 64, stats: { speed: 71, shooting: 61, passing: 59, ball_control: 65, dribbling: 67, defense: 47, physical: 56, stamina: 69 } },
    11: { name: "Kiro Danex", pos: "CF", rarity: "Standard", ovr: 66, stats: { speed: 68, shooting: 68, passing: 55, ball_control: 63, dribbling: 64, defense: 45, physical: 65, stamina: 67 } },

    // --- STANDARD PLAYERS (12-50) ---
    12: { name: "Vexo Larnic", pos: "RMF", rarity: "Standard", ovr: 63, stats: { speed: 66, shooting: 56, passing: 62, ball_control: 61, dribbling: 63, defense: 50, physical: 58, stamina: 68 } },
    13: { name: "Darin Solvek", pos: "LMF", rarity: "Standard", ovr: 62, stats: { speed: 65, shooting: 55, passing: 60, ball_control: 60, dribbling: 62, defense: 51, physical: 57, stamina: 67 } },
    14: { name: "Huron Calex", pos: "CB", rarity: "Standard", ovr: 60, stats: { speed: 54, shooting: 40, passing: 52, ball_control: 50, dribbling: 48, defense: 63, physical: 67, stamina: 62 } },
    15: { name: "Kavin Rosto", pos: "RB", rarity: "Standard", ovr: 61, stats: { speed: 64, shooting: 46, passing: 57, ball_control: 56, dribbling: 55, defense: 62, physical: 63, stamina: 66 } },
    16: { name: "Elmar Dovik", pos: "LB", rarity: "Standard", ovr: 61, stats: { speed: 63, shooting: 45, passing: 58, ball_control: 57, dribbling: 56, defense: 61, physical: 62, stamina: 67 } },
    17: { name: "Ryo Fenrik", pos: "DMF", rarity: "Standard", ovr: 62, stats: { speed: 57, shooting: 49, passing: 59, ball_control: 58, dribbling: 56, defense: 63, physical: 65, stamina: 68 } },
    18: { name: "Silan Varek", pos: "CMF", rarity: "Standard", ovr: 63, stats: { speed: 60, shooting: 53, passing: 63, ball_control: 62, dribbling: 60, defense: 57, physical: 59, stamina: 69 } },
    19: { name: "Timo Alrex", pos: "AMF", rarity: "Standard", ovr: 64, stats: { speed: 62, shooting: 61, passing: 65, ball_control: 66, dribbling: 67, defense: 51, physical: 57, stamina: 66 } },
    20: { name: "Joren Paxis", pos: "RWF", rarity: "Standard", ovr: 63, stats: { speed: 69, shooting: 59, passing: 57, ball_control: 63, dribbling: 65, defense: 47, physical: 56, stamina: 68 } },
    21: { name: "Leno Kryx", pos: "LWF", rarity: "Standard", ovr: 63, stats: { speed: 70, shooting: 60, passing: 58, ball_control: 64, dribbling: 66, defense: 46, physical: 55, stamina: 69 } },
    22: { name: "Breno Valt", pos: "CF", rarity: "Standard", ovr: 65, stats: { speed: 67, shooting: 66, passing: 54, ball_control: 62, dribbling: 63, defense: 44, physical: 66, stamina: 67 } },
    23: { name: "Orin Malvek", pos: "GK", rarity: "Standard", ovr: 61, stats: { gk_diving: 63, gk_reflexes: 62, gk_handling: 59, gk_positioning: 60, gk_kicking: 57, physical: 65, stamina: 53 } },
    24: { name: "Cavin Durex", pos: "CB", rarity: "Standard", ovr: 62, stats: { speed: 56, shooting: 41, passing: 53, ball_control: 51, dribbling: 49, defense: 65, physical: 68, stamina: 64 } },
    25: { name: "Yaro Belix", pos: "RB", rarity: "Standard", ovr: 60, stats: { speed: 62, shooting: 44, passing: 56, ball_control: 55, dribbling: 54, defense: 60, physical: 61, stamina: 66 } },
    26: { name: "Evan Lorix", pos: "LB", rarity: "Standard", ovr: 61, stats: { speed: 63, shooting: 45, passing: 57, ball_control: 56, dribbling: 55, defense: 61, physical: 62, stamina: 67 } },
    27: { name: "Talen Dorvik", pos: "DMF", rarity: "Standard", ovr: 62, stats: { speed: 58, shooting: 50, passing: 60, ball_control: 59, dribbling: 57, defense: 64, physical: 65, stamina: 68 } },
    28: { name: "Rylan Vorix", pos: "CMF", rarity: "Standard", ovr: 63, stats: { speed: 60, shooting: 52, passing: 62, ball_control: 61, dribbling: 60, defense: 58, physical: 60, stamina: 69 } },
    29: { name: "Jaxen Molt", pos: "AMF", rarity: "Standard", ovr: 64, stats: { speed: 63, shooting: 61, passing: 65, ball_control: 66, dribbling: 67, defense: 52, physical: 58, stamina: 67 } },
    30: { name: "Kairo Bentos", pos: "RWF", rarity: "Standard", ovr: 64, stats: { speed: 70, shooting: 60, passing: 58, ball_control: 64, dribbling: 66, defense: 48, physical: 57, stamina: 68 } },
    31: { name: "Lucan Ferrox", pos: "LWF", rarity: "Standard", ovr: 63, stats: { speed: 71, shooting: 61, passing: 59, ball_control: 65, dribbling: 67, defense: 47, physical: 56, stamina: 69 } },
    32: { name: "Bran Kolmer", pos: "CF", rarity: "Standard", ovr: 65, stats: { speed: 68, shooting: 68, passing: 55, ball_control: 63, dribbling: 64, defense: 45, physical: 65, stamina: 67 } },
    33: { name: "Stefan Ryze", pos: "GK", rarity: "Standard", ovr: 61, stats: { gk_diving: 63, gk_reflexes: 62, gk_handling: 59, gk_positioning: 60, gk_kicking: 57, physical: 65, stamina: 53 } },
    34: { name: "Oren Talvik", pos: "CB", rarity: "Standard", ovr: 62, stats: { speed: 56, shooting: 41, passing: 53, ball_control: 51, dribbling: 49, defense: 65, physical: 68, stamina: 64 } },
    35: { name: "Yanik Dorren", pos: "RB", rarity: "Standard", ovr: 60, stats: { speed: 62, shooting: 44, passing: 56, ball_control: 55, dribbling: 54, defense: 60, physical: 61, stamina: 66 } },
    36: { name: "Milo Kraven", pos: "LB", rarity: "Standard", ovr: 61, stats: { speed: 63, shooting: 45, passing: 57, ball_control: 56, dribbling: 55, defense: 61, physical: 62, stamina: 67 } },
    37: { name: "Arven Daxor", pos: "DMF", rarity: "Standard", ovr: 62, stats: { speed: 58, shooting: 50, passing: 60, ball_control: 59, dribbling: 57, defense: 64, physical: 65, stamina: 68 } },
    38: { name: "Felix Ronar", pos: "CMF", rarity: "Standard", ovr: 63, stats: { speed: 60, shooting: 53, passing: 63, ball_control: 62, dribbling: 60, defense: 58, physical: 60, stamina: 69 } },
    39: { name: "Noel Kintar", pos: "AMF", rarity: "Standard", ovr: 64, stats: { speed: 63, shooting: 61, passing: 65, ball_control: 66, dribbling: 67, defense: 52, physical: 58, stamina: 67 } },
    40: { name: "Sandro Lext", pos: "RWF", rarity: "Standard", ovr: 64, stats: { speed: 70, shooting: 60, passing: 58, ball_control: 64, dribbling: 66, defense: 48, physical: 57, stamina: 68 } },
    41: { name: "Ivaro Nems", pos: "LWF", rarity: "Standard", ovr: 63, stats: { speed: 71, shooting: 61, passing: 59, ball_control: 65, dribbling: 67, defense: 47, physical: 56, stamina: 69 } },
    42: { name: "Tomas Velro", pos: "CF", rarity: "Standard", ovr: 65, stats: { speed: 68, shooting: 68, passing: 55, ball_control: 63, dribbling: 64, defense: 45, physical: 65, stamina: 67 } },
    43: { name: "Ruben Axto", pos: "GK", rarity: "Standard", ovr: 61, stats: { gk_diving: 63, gk_reflexes: 62, gk_handling: 59, gk_positioning: 60, gk_kicking: 57, physical: 65, stamina: 53 } },
    44: { name: "Jaxen Molto", pos: "CB", rarity: "Standard", ovr: 62, stats: { speed: 56, shooting: 41, passing: 53, ball_control: 51, dribbling: 49, defense: 65, physical: 68, stamina: 64 } },
    45: { name: "Piero Zanex", pos: "RB", rarity: "Standard", ovr: 60, stats: { speed: 62, shooting: 44, passing: 56, ball_control: 55, dribbling: 54, defense: 60, physical: 61, stamina: 66 } },
    46: { name: "Zorin Valeo", pos: "LB", rarity: "Standard", ovr: 61, stats: { speed: 63, shooting: 45, passing: 57, ball_control: 56, dribbling: 55, defense: 61, physical: 62, stamina: 67 } },
    47: { name: "Luan Corvic", pos: "DMF", rarity: "Standard", ovr: 62, stats: { speed: 58, shooting: 50, passing: 60, ball_control: 59, dribbling: 57, defense: 64, physical: 65, stamina: 68 } },
    48: { name: "Karel Mirox", pos: "CMF", rarity: "Standard", ovr: 63, stats: { speed: 60, shooting: 53, passing: 63, ball_control: 62, dribbling: 60, defense: 58, physical: 60, stamina: 69 } },
    49: { name: "Jonis Pelto", pos: "AMF", rarity: "Standard", ovr: 64, stats: { speed: 63, shooting: 61, passing: 65, ball_control: 66, dribbling: 67, defense: 52, physical: 58, stamina: 67 } },
    50: { name: "Ravel Dron", pos: "CF", rarity: "Standard", ovr: 65, stats: { speed: 68, shooting: 68, passing: 55, ball_control: 63, dribbling: 64, defense: 45, physical: 65, stamina: 67 } },
    51: { name: "Varko Lenth", pos: "GK", rarity: "Rare", ovr: 68, stats: { gk_diving: 70, gk_reflexes: 69, gk_handling: 67, gk_positioning: 68, gk_kicking: 65, physical: 70, stamina: 60 } },
    52: { name: "Dario Vexel", pos: "RB", rarity: "Rare", ovr: 66, stats: { speed: 70, shooting: 50, passing: 62, ball_control: 61, dribbling: 63, defense: 65, physical: 64, stamina: 70 } },
    53: { name: "Marven Holix", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 60, shooting: 48, passing: 58, ball_control: 55, dribbling: 53, defense: 70, physical: 72, stamina: 68 } },
    54: { name: "Tavon Zirel", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 61, shooting: 49, passing: 59, ball_control: 56, dribbling: 54, defense: 71, physical: 73, stamina: 69 } },
    55: { name: "Liran Dexel", pos: "LB", rarity: "Rare", ovr: 66, stats: { speed: 68, shooting: 48, passing: 60, ball_control: 59, dribbling: 61, defense: 65, physical: 63, stamina: 70 } },
    56: { name: "Nylan Corvo", pos: "DMF", rarity: "Rare", ovr: 68, stats: { speed: 62, shooting: 55, passing: 66, ball_control: 63, dribbling: 60, defense: 68, physical: 70, stamina: 72 } },
    57: { name: "Arvin Zoltek", pos: "CMF", rarity: "Rare", ovr: 69, stats: { speed: 64, shooting: 58, passing: 68, ball_control: 65, dribbling: 63, defense: 60, physical: 62, stamina: 73 } },
    58: { name: "Cairo Valtrex", pos: "AMF", rarity: "Rare", ovr: 70, stats: { speed: 66, shooting: 65, passing: 70, ball_control: 70, dribbling: 72, defense: 55, physical: 60, stamina: 71 } },
    59: { name: "Zeno Marvik", pos: "RWF", rarity: "Rare", ovr: 69, stats: { speed: 75, shooting: 65, passing: 62, ball_control: 68, dribbling: 70, defense: 50, physical: 60, stamina: 72 } },
    60: { name: "Elios Ravin", pos: "LWF", rarity: "Rare", ovr: 69, stats: { speed: 76, shooting: 66, passing: 63, ball_control: 69, dribbling: 71, defense: 49, physical: 59, stamina: 73 } },
    61: { name: "Kiro Vonnel", pos: "CF", rarity: "Rare", ovr: 71, stats: { speed: 72, shooting: 72, passing: 60, ball_control: 68, dribbling: 69, defense: 47, physical: 70, stamina: 71 } },
    62: { name: "Raven Kolter", pos: "GK", rarity: "Rare", ovr: 68, stats: { gk_diving: 70, gk_reflexes: 69, gk_handling: 67, gk_positioning: 68, gk_kicking: 65, physical: 70, stamina: 60 } },
    63: { name: "Talon Brevik", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 61, shooting: 48, passing: 59, ball_control: 56, dribbling: 54, defense: 71, physical: 73, stamina: 69 } },
    64: { name: "Daxel Varon", pos: "RB", rarity: "Rare", ovr: 66, stats: { speed: 70, shooting: 50, passing: 62, ball_control: 61, dribbling: 63, defense: 65, physical: 64, stamina: 70 } },
    65: { name: "Zyren Kaltor", pos: "LB", rarity: "Rare", ovr: 66, stats: { speed: 68, shooting: 48, passing: 60, ball_control: 59, dribbling: 61, defense: 65, physical: 63, stamina: 70 } },
    66: { name: "Mavrix Dolven", pos: "DMF", rarity: "Rare", ovr: 68, stats: { speed: 62, shooting: 55, passing: 66, ball_control: 63, dribbling: 60, defense: 68, physical: 70, stamina: 72 } },
    67: { name: "Lior Tenrek", pos: "CMF", rarity: "Rare", ovr: 69, stats: { speed: 64, shooting: 58, passing: 68, ball_control: 65, dribbling: 63, defense: 60, physical: 62, stamina: 73 } },
    68: { name: "Kyran Velox", pos: "AMF", rarity: "Rare", ovr: 70, stats: { speed: 66, shooting: 65, passing: 70, ball_control: 70, dribbling: 72, defense: 55, physical: 60, stamina: 71 } },
    69: { name: "Jaren Falco", pos: "RWF", rarity: "Rare", ovr: 69, stats: { speed: 75, shooting: 65, passing: 62, ball_control: 68, dribbling: 70, defense: 50, physical: 60, stamina: 72 } },
    70: { name: "Eryx Malden", pos: "LWF", rarity: "Rare", ovr: 69, stats: { speed: 76, shooting: 66, passing: 63, ball_control: 69, dribbling: 71, defense: 49, physical: 59, stamina: 73 } },
    71: { name: "Torin Baxel", pos: "CF", rarity: "Rare", ovr: 71, stats: { speed: 72, shooting: 72, passing: 60, ball_control: 68, dribbling: 69, defense: 47, physical: 70, stamina: 71 } },
    72: { name: "Nero Valtis", pos: "GK", rarity: "Rare", ovr: 68, stats: { gk_diving: 70, gk_reflexes: 69, gk_handling: 67, gk_positioning: 68, gk_kicking: 65, physical: 70, stamina: 60 } },
    73: { name: "Rylon Tarez", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 61, shooting: 48, passing: 59, ball_control: 56, dribbling: 54, defense: 71, physical: 73, stamina: 69 } },
    74: { name: "Caden Lorik", pos: "RB", rarity: "Rare", ovr: 66, stats: { speed: 70, shooting: 50, passing: 62, ball_control: 61, dribbling: 63, defense: 65, physical: 64, stamina: 70 } },
    75: { name: "Alrik Venson", pos: "LB", rarity: "Rare", ovr: 66, stats: { speed: 68, shooting: 48, passing: 60, ball_control: 59, dribbling: 61, defense: 65, physical: 63, stamina: 70 } },
    76: { name: "Davor Tenrek", pos: "DMF", rarity: "Rare", ovr: 68, stats: { speed: 62, shooting: 55, passing: 66, ball_control: 63, dribbling: 60, defense: 68, physical: 70, stamina: 72 } },
    77: { name: "Lyor Vance", pos: "CMF", rarity: "Rare", ovr: 69, stats: { speed: 64, shooting: 58, passing: 68, ball_control: 65, dribbling: 63, defense: 60, physical: 62, stamina: 73 } },
    78: { name: "Rivan Dorel", pos: "AMF", rarity: "Rare", ovr: 70, stats: { speed: 66, shooting: 65, passing: 70, ball_control: 70, dribbling: 72, defense: 55, physical: 60, stamina: 71 } },
    79: { name: "Zyren Malto", pos: "RWF", rarity: "Rare", ovr: 69, stats: { speed: 75, shooting: 65, passing: 62, ball_control: 68, dribbling: 70, defense: 50, physical: 60, stamina: 72 } },
    80: { name: "Eron Valdex", pos: "LWF", rarity: "Rare", ovr: 69, stats: { speed: 76, shooting: 66, passing: 63, ball_control: 69, dribbling: 71, defense: 49, physical: 59, stamina: 73 } },
    81: { name: "Torval Nix", pos: "CF", rarity: "Rare", ovr: 71, stats: { speed: 72, shooting: 72, passing: 60, ball_control: 68, dribbling: 69, defense: 47, physical: 70, stamina: 71 } },
    82: { name: "Dax Venrol", pos: "GK", rarity: "Rare", ovr: 68, stats: { gk_diving: 70, gk_reflexes: 69, gk_handling: 67, gk_positioning: 68, gk_kicking: 65, physical: 70, stamina: 60 } },
    83: { name: "Korin Veylo", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 61, shooting: 48, passing: 59, ball_control: 56, dribbling: 54, defense: 71, physical: 73, stamina: 69 } },
    84: { name: "Loran Baxel", pos: "RB", rarity: "Rare", ovr: 66, stats: { speed: 70, shooting: 50, passing: 62, ball_control: 61, dribbling: 63, defense: 65, physical: 64, stamina: 70 } },
    85: { name: "Niran Dexel", pos: "LB", rarity: "Rare", ovr: 66, stats: { speed: 68, shooting: 48, passing: 60, ball_control: 59, dribbling: 61, defense: 65, physical: 63, stamina: 70 } },
    86: { name: "Talen Vorik", pos: "DMF", rarity: "Rare", ovr: 68, stats: { speed: 62, shooting: 55, passing: 66, ball_control: 63, dribbling: 60, defense: 68, physical: 70, stamina: 72 } },
    87: { name: "Javen Lorix", pos: "CMF", rarity: "Rare", ovr: 69, stats: { speed: 64, shooting: 58, passing: 68, ball_control: 65, dribbling: 63, defense: 60, physical: 62, stamina: 73 } },
    88: { name: "Rylan Dorvek", pos: "AMF", rarity: "Rare", ovr: 70, stats: { speed: 66, shooting: 65, passing: 70, ball_control: 70, dribbling: 72, defense: 55, physical: 60, stamina: 71 } },
    89: { name: "Kiran Valtor", pos: "RWF", rarity: "Rare", ovr: 69, stats: { speed: 75, shooting: 65, passing: 62, ball_control: 68, dribbling: 70, defense: 50, physical: 60, stamina: 72 } },
    90: { name: "Soren Malvik", pos: "LWF", rarity: "Rare", ovr: 69, stats: { speed: 76, shooting: 66, passing: 63, ball_control: 69, dribbling: 71, defense: 49, physical: 59, stamina: 73 } },
    91: { name: "Daven Korvik", pos: "CF", rarity: "Rare", ovr: 71, stats: { speed: 72, shooting: 72, passing: 60, ball_control: 68, dribbling: 69, defense: 47, physical: 70, stamina: 71 } },
    92: { name: "Eryx Falden", pos: "GK", rarity: "Rare", ovr: 68, stats: { gk_diving: 70, gk_reflexes: 69, gk_handling: 67, gk_positioning: 68, gk_kicking: 65, physical: 70, stamina: 60 } },
    93: { name: "Talen Ruvik", pos: "CB", rarity: "Rare", ovr: 67, stats: { speed: 61, shooting: 48, passing: 59, ball_control: 56, dribbling: 54, defense: 71, physical: 73, stamina: 69 } },
    94: { name: "Liron Vaxel", pos: "RB", rarity: "Rare", ovr: 66, stats: { speed: 70, shooting: 50, passing: 62, ball_control: 61, dribbling: 63, defense: 65, physical: 64, stamina: 70 } },
    95: { name: "Kiro Malven", pos: "LB", rarity: "Rare", ovr: 66, stats: { speed: 68, shooting: 48, passing: 60, ball_control: 59, dribbling: 61, defense: 65, physical: 63, stamina: 70 } },
    96: { name: "Veyron Kaltas", pos: "GK", rarity: "Epic", ovr: 73, stats: { gk_diving: 75, gk_reflexes: 74, gk_handling: 72, gk_positioning: 73, gk_kicking: 70, physical: 75, stamina: 65 } },
    97: { name: "Daxen Vorik", pos: "RB", rarity: "Epic", ovr: 71, stats: { speed: 76, shooting: 58, passing: 66, ball_control: 65, dribbling: 67, defense: 71, physical: 69, stamina: 74 } },
    98: { name: "Toren Valdex", pos: "CB", rarity: "Epic", ovr: 72, stats: { speed: 63, shooting: 52, passing: 62, ball_control: 59, dribbling: 57, defense: 76, physical: 78, stamina: 73 } },
    99: { name: "Liron Dexel", pos: "CB", rarity: "Epic", ovr: 72, stats: { speed: 64, shooting: 53, passing: 63, ball_control: 60, dribbling: 58, defense: 77, physical: 79, stamina: 74 } },
    100: { name: "Ravik Molten", pos: "LB", rarity: "Epic", ovr: 71, stats: { speed: 74, shooting: 55, passing: 65, ball_control: 64, dribbling: 66, defense: 71, physical: 68, stamina: 74 } },
    101: { name: "Cayron Dexis", pos: "DMF", rarity: "Epic", ovr: 73, stats: { speed: 66, shooting: 60, passing: 70, ball_control: 68, dribbling: 65, defense: 74, physical: 75, stamina: 76 } },
    102: { name: "Kiron Valtor", pos: "CMF", rarity: "Epic", ovr: 74, stats: { speed: 68, shooting: 63, passing: 72, ball_control: 70, dribbling: 68, defense: 63, physical: 65, stamina: 77 } },
    103: { name: "Tavon Krex", pos: "AMF", rarity: "Epic", ovr: 75, stats: { speed: 70, shooting: 70, passing: 75, ball_control: 74, dribbling: 76, defense: 58, physical: 64, stamina: 75 } },
    104: { name: "Zyren Valtrex", pos: "RWF", rarity: "Epic", ovr: 74, stats: { speed: 80, shooting: 70, passing: 66, ball_control: 72, dribbling: 74, defense: 53, physical: 63, stamina: 76 } },
    105: { name: "Eryx Falden", pos: "LWF", rarity: "Epic", ovr: 74, stats: { speed: 81, shooting: 71, passing: 67, ball_control: 73, dribbling: 75, defense: 52, physical: 62, stamina: 77 } },
    106: { name: "Torik Malven", pos: "CF", rarity: "Epic", ovr: 76, stats: { speed: 78, shooting: 78, passing: 64, ball_control: 72, dribbling: 73, defense: 50, physical: 75, stamina: 74 } },
    107: { name: "Ravik Norel", pos: "GK", rarity: "Epic", ovr: 73, stats: { gk_diving: 75, gk_reflexes: 74, gk_handling: 72, gk_positioning: 73, gk_kicking: 70, physical: 75, stamina: 65 } },
    108: { name: "Darian Velox", pos: "CB", rarity: "Epic", ovr: 72, stats: { speed: 64, shooting: 53, passing: 63, ball_control: 60, dribbling: 58, defense: 77, physical: 79, stamina: 74 } },
    109: { name: "Milo Tarez", pos: "RB", rarity: "Epic", ovr: 71, stats: { speed: 76, shooting: 58, passing: 66, ball_control: 65, dribbling: 67, defense: 71, physical: 69, stamina: 74 } },
    110: { name: "Loren Baxel", pos: "LB", rarity: "Epic", ovr: 71, stats: { speed: 74, shooting: 55, passing: 65, ball_control: 64, dribbling: 66, defense: 71, physical: 68, stamina: 74 } },
    111: { name: "Rylon Vorik", pos: "DMF", rarity: "Epic", ovr: 73, stats: { speed: 66, shooting: 60, passing: 70, ball_control: 68, dribbling: 65, defense: 74, physical: 75, stamina: 76 } },
    112: { name: "Caylen Molt", pos: "CMF", rarity: "Epic", ovr: 74, stats: { speed: 68, shooting: 63, passing: 72, ball_control: 70, dribbling: 68, defense: 63, physical: 65, stamina: 77 } },
    113: { name: "Zylen Vorn", pos: "AMF", rarity: "Epic", ovr: 75, stats: { speed: 70, shooting: 70, passing: 75, ball_control: 74, dribbling: 76, defense: 58, physical: 64, stamina: 75 } },
    114: { name: "Talon Krex", pos: "RWF", rarity: "Epic", ovr: 74, stats: { speed: 80, shooting: 70, passing: 66, ball_control: 72, dribbling: 74, defense: 53, physical: 63, stamina: 76 } },
    115: { name: "Eron Malvek", pos: "LWF", rarity: "Epic", ovr: 74, stats: { speed: 81, shooting: 71, passing: 67, ball_control: 73, dribbling: 75, defense: 52, physical: 62, stamina: 77 } },
    116: { name: "Kiran Dovek", pos: "CF", rarity: "Epic", ovr: 76, stats: { speed: 78, shooting: 78, passing: 64, ball_control: 72, dribbling: 73, defense: 50, physical: 75, stamina: 74 } },
    117: { name: "Rivon Velix", pos: "GK", rarity: "Epic", ovr: 73, stats: { gk_diving: 75, gk_reflexes: 74, gk_handling: 72, gk_positioning: 73, gk_kicking: 70, physical: 75, stamina: 65 } },
    118: { name: "Daven Talrik", pos: "CB", rarity: "Epic", ovr: 72, stats: { speed: 64, shooting: 53, passing: 63, ball_control: 60, dribbling: 58, defense: 77, physical: 79, stamina: 74 } },
    119: { name: "Lirax Vornel", pos: "RB", rarity: "Epic", ovr: 71, stats: { speed: 76, shooting: 58, passing: 66, ball_control: 65, dribbling: 67, defense: 71, physical: 69, stamina: 74 } },
    120: { name: "Toren Daxel", pos: "LB", rarity: "Epic", ovr: 71, stats: { speed: 74, shooting: 55, passing: 65, ball_control: 64, dribbling: 66, defense: 71, physical: 68, stamina: 74 } },
    121: { name: "Arvin Moltek", pos: "DMF", rarity: "Epic", ovr: 73, stats: { speed: 66, shooting: 60, passing: 70, ball_control: 68, dribbling: 65, defense: 74, physical: 75, stamina: 76 } },
    122: { name: "Caylen Valtor", pos: "CMF", rarity: "Epic", ovr: 74, stats: { speed: 68, shooting: 63, passing: 72, ball_control: 70, dribbling: 68, defense: 63, physical: 65, stamina: 77 } },
    123: { name: "Zyren Velox", pos: "AMF", rarity: "Epic", ovr: 75, stats: { speed: 70, shooting: 70, passing: 75, ball_control: 74, dribbling: 76, defense: 58, physical: 64, stamina: 75 } },
    124: { name: "Torik Veyro", pos: "RWF", rarity: "Epic", ovr: 74, stats: { speed: 80, shooting: 70, passing: 66, ball_control: 72, dribbling: 74, defense: 53, physical: 63, stamina: 76 } },
    125: { name: "Eryx Falden", pos: "LWF", rarity: "Epic", ovr: 74, stats: { speed: 81, shooting: 71, passing: 67, ball_control: 73, dribbling: 75, defense: 52, physical: 62, stamina: 77 } },
    126: { name: "Loran Krex", pos: "CF", rarity: "Epic", ovr: 76, stats: { speed: 78, shooting: 78, passing: 64, ball_control: 72, dribbling: 73, defense: 50, physical: 75, stamina: 74 } },
    127: { name: "Riven Talon", pos: "GK", rarity: "Epic", ovr: 73, stats: { gk_diving: 75, gk_reflexes: 74, gk_handling: 72, gk_positioning: 73, gk_kicking: 70, physical: 75, stamina: 65 } },
    128: { name: "Daxel Vorin", pos: "CB", rarity: "Epic", ovr: 72, stats: { speed: 64, shooting: 53, passing: 63, ball_control: 60, dribbling: 58, defense: 77, physical: 79, stamina: 74 } },
    129: { name: "Cairon Velrik", pos: "RB", rarity: "Epic", ovr: 71, stats: { speed: 76, shooting: 58, passing: 66, ball_control: 65, dribbling: 67, defense: 71, physical: 69, stamina: 74 } },
    130: { name: "Lyron Maltek", pos: "LB", rarity: "Epic", ovr: 71, stats: { speed: 74, shooting: 55, passing: 65, ball_control: 64, dribbling: 66, defense: 71, physical: 68, stamina: 74 } },
    131: { name: "Torven Daxor", pos: "DMF", rarity: "Epic", ovr: 73, stats: { speed: 66, shooting: 60, passing: 70, ball_control: 68, dribbling: 65, defense: 74, physical: 75, stamina: 76 } },
    132: { name: "Zyron Velik", pos: "CMF", rarity: "Epic", ovr: 74, stats: { speed: 68, shooting: 63, passing: 72, ball_control: 70, dribbling: 68, defense: 63, physical: 65, stamina: 77 } },
    133: { name: "Kiron Vaxel", pos: "AMF", rarity: "Epic", ovr: 75, stats: { speed: 70, shooting: 70, passing: 75, ball_control: 74, dribbling: 76, defense: 58, physical: 64, stamina: 75 } },
    134: { name: "Eron Valdex", pos: "RWF", rarity: "Epic", ovr: 74, stats: { speed: 80, shooting: 70, passing: 66, ball_control: 72, dribbling: 74, defense: 53, physical: 63, stamina: 76 } },
    135: { name: "Tavon Malrix", pos: "LWF", rarity: "Epic", ovr: 74, stats: { speed: 81, shooting: 71, passing: 67, ball_control: 73, dribbling: 75, defense: 52, physical: 62, stamina: 77 } },

    // --- PREMIUM LEGENDS (201-240) ---
    201: { name: "NOR GT", pos: "CF", rarity: "Premium Legend", ovr: 150, stats: { speed: 98, shooting: 98, passing: 92, ball_control: 96, dribbling: 97, defense: 65, physical: 95, stamina: 98 } },
    202: { name: "NEBU DBX", pos: "AMF", rarity: "Premium Legend", ovr: 150, stats: { speed: 97, shooting: 96, passing: 98, ball_control: 97, dribbling: 96, defense: 68, physical: 92, stamina: 97 } },
    203: { name: "SREE HARII", pos: "GK", rarity: "Premium Legend", ovr: 150, stats: { gk_diving: 98, gk_reflexes: 97, gk_handling: 96, gk_positioning: 95, gk_kicking: 94, physical: 92, stamina: 97 } },
    204: { name: "Massi Rondo", pos: "RWF", rarity: "Premium", ovr: 144, stats: { speed: 96, shooting: 90, passing: 88, ball_control: 92, dribbling: 94, defense: 65, physical: 90, stamina: 93 } },
    205: { name: "Ranoldo Vexel", pos: "CF", rarity: "Premium", ovr: 143, stats: { speed: 95, shooting: 91, passing: 85, ball_control: 91, dribbling: 93, defense: 63, physical: 89, stamina: 92 } },
    206: { name: "Nayamer Dexel", pos: "LWF", rarity: "Premium", ovr: 142, stats: { speed: 97, shooting: 88, passing: 84, ball_control: 90, dribbling: 92, defense: 60, physical: 88, stamina: 91 } },
    207: { name: "Mbabepe Lorik", pos: "CF", rarity: "Premium", ovr: 141, stats: { speed: 96, shooting: 89, passing: 83, ball_control: 91, dribbling: 93, defense: 61, physical: 87, stamina: 90 } },
    208: { name: "Albie Tolen", pos: "AMF", rarity: "Premium", ovr: 140, stats: { speed: 92, shooting: 85, passing: 89, ball_control: 90, dribbling: 88, defense: 66, physical: 85, stamina: 88 } },
    209: { name: "Joshwel Rocay", pos: "CMF", rarity: "Premium", ovr: 139, stats: { speed: 91, shooting: 83, passing: 88, ball_control: 89, dribbling: 87, defense: 68, physical: 84, stamina: 87 } },
    210: { name: "Yadhubub Lorvik", pos: "DMF", rarity: "Premium", ovr: 138, stats: { speed: 88, shooting: 80, passing: 87, ball_control: 86, dribbling: 85, defense: 82, physical: 83, stamina: 88 } },
    211: { name: "Tavrix Molven", pos: "CB", rarity: "Premium", ovr: 137, stats: { speed: 78, shooting: 70, passing: 77, ball_control: 75, dribbling: 73, defense: 90, physical: 89, stamina: 82 } },
    212: { name: "Cairon Vexel", pos: "CB", rarity: "Premium", ovr: 137, stats: { speed: 77, shooting: 71, passing: 76, ball_control: 74, dribbling: 72, defense: 89, physical: 88, stamina: 82 } },
    213: { name: "Daren Falvik", pos: "RB", rarity: "Premium", ovr: 136, stats: { speed: 86, shooting: 72, passing: 78, ball_control: 79, dribbling: 81, defense: 85, physical: 84, stamina: 86 } },
    214: { name: "Liron Veyron", pos: "LB", rarity: "Premium", ovr: 136, stats: { speed: 85, shooting: 70, passing: 77, ball_control: 78, dribbling: 80, defense: 84, physical: 83, stamina: 85 } },
    215: { name: "Rivon Klyne", pos: "DMF", rarity: "Premium", ovr: 135, stats: { speed: 80, shooting: 74, passing: 82, ball_control: 81, dribbling: 79, defense: 88, physical: 86, stamina: 84 } },
    216: { name: "Zyren Falden", pos: "CMF", rarity: "Premium", ovr: 135, stats: { speed: 81, shooting: 75, passing: 83, ball_control: 82, dribbling: 80, defense: 85, physical: 84, stamina: 85 } },
    217: { name: "Tavon Krex", pos: "AMF", rarity: "Premium", ovr: 134, stats: { speed: 83, shooting: 77, passing: 86, ball_control: 85, dribbling: 84, defense: 80, physical: 82, stamina: 84 } },
    218: { name: "Kiron Valtrex", pos: "RWF", rarity: "Premium", ovr: 134, stats: { speed: 88, shooting: 79, passing: 81, ball_control: 83, dribbling: 85, defense: 70, physical: 81, stamina: 86 } },
    219: { name: "Eryx Vornel", pos: "LWF", rarity: "Premium", ovr: 134, stats: { speed: 89, shooting: 80, passing: 82, ball_control: 84, dribbling: 86, defense: 71, physical: 82, stamina: 87 } },
    220: { name: "Torik Dexel", pos: "CF", rarity: "Premium", ovr: 133, stats: { speed: 87, shooting: 83, passing: 78, ball_control: 82, dribbling: 85, defense: 65, physical: 83, stamina: 85 } },
    221: { name: "Ravon Valtor", pos: "GK", rarity: "Premium", ovr: 133, stats: { gk_diving: 88, gk_reflexes: 87, gk_handling: 86, gk_positioning: 85, gk_kicking: 83, physical: 84, stamina: 86 } },
    222: { name: "Daren Velix", pos: "CB", rarity: "Premium", ovr: 132, stats: { speed: 75, shooting: 70, passing: 75, ball_control: 74, dribbling: 72, defense: 87, physical: 86, stamina: 82 } },
    223: { name: "Lyron Vexel", pos: "RB", rarity: "Premium", ovr: 132, stats: { speed: 85, shooting: 73, passing: 78, ball_control: 79, dribbling: 81, defense: 83, physical: 82, stamina: 84 } },
    224: { name: "Mavrix Lorik", pos: "LB", rarity: "Premium", ovr: 132, stats: { speed: 84, shooting: 72, passing: 77, ball_control: 78, dribbling: 80, defense: 82, physical: 81, stamina: 83 } },
    225: { name: "Zylen Moltek", pos: "DMF", rarity: "Premium", ovr: 131, stats: { speed: 79, shooting: 74, passing: 81, ball_control: 80, dribbling: 78, defense: 86, physical: 84, stamina: 82 } },
    226: { name: "Cairon Veyro", pos: "CMF", rarity: "Premium", ovr: 131, stats: { speed: 80, shooting: 75, passing: 82, ball_control: 81, dribbling: 79, defense: 83, physical: 82, stamina: 83 } },
    227: { name: "Tavrix Daxon", pos: "AMF", rarity: "Premium", ovr: 130, stats: { speed: 82, shooting: 77, passing: 84, ball_control: 83, dribbling: 82, defense: 79, physical: 81, stamina: 82 } },
    228: { name: "Eryx Falden", pos: "RWF", rarity: "Premium", ovr: 130, stats: { speed: 87, shooting: 79, passing: 80, ball_control: 82, dribbling: 84, defense: 68, physical: 80, stamina: 85 } },
    229: { name: "Loran Dexel", pos: "LWF", rarity: "Premium", ovr: 130, stats: { speed: 88, shooting: 80, passing: 81, ball_control: 83, dribbling: 85, defense: 69, physical: 81, stamina: 86 } },
    230: { name: "Daxel Molvik", pos: "CF", rarity: "Premium", ovr: 129, stats: { speed: 86, shooting: 82, passing: 77, ball_control: 81, dribbling: 84, defense: 64, physical: 82, stamina: 84 } },
    231: { name: "Ravik Vorik", pos: "GK", rarity: "Premium", ovr: 129, stats: { gk_diving: 86, gk_reflexes: 85, gk_handling: 84, gk_positioning: 83, gk_kicking: 81, physical: 82, stamina: 85 } },
    232: { name: "Cayden Valtor", pos: "CB", rarity: "Premium", ovr: 128, stats: { speed: 74, shooting: 69, passing: 73, ball_control: 72, dribbling: 71, defense: 85, physical: 84, stamina: 80 } },
    233: { name: "Tavrix Lorik", pos: "RB", rarity: "Premium", ovr: 128, stats: { speed: 84, shooting: 72, passing: 77, ball_control: 78, dribbling: 80, defense: 81, physical: 80, stamina: 82 } },
    234: { name: "Cairon Dexel", pos: "LB", rarity: "Premium", ovr: 128, stats: { speed: 83, shooting: 71, passing: 76, ball_control: 77, dribbling: 79, defense: 80, physical: 79, stamina: 81 } },
    235: { name: "Daren Valtor", pos: "DMF", rarity: "Premium", ovr: 127, stats: { speed: 78, shooting: 73, passing: 79, ball_control: 78, dribbling: 76, defense: 83, physical: 82, stamina: 80 } },
    236: { name: "Lyron Falden", pos: "CMF", rarity: "Premium", ovr: 127, stats: { speed: 79, shooting: 74, passing: 80, ball_control: 79, dribbling: 77, defense: 81, physical: 80, stamina: 81 } },
    237: { name: "Mavrix Dexel", pos: "AMF", rarity: "Premium", ovr: 126, stats: { speed: 81, shooting: 76, passing: 82, ball_control: 81, dribbling: 80, defense: 78, physical: 79, stamina: 80 } },
    238: { name: "Zyren Veyron", pos: "RWF", rarity: "Premium", ovr: 126, stats: { speed: 86, shooting: 78, passing: 79, ball_control: 81, dribbling: 83, defense: 66, physical: 78, stamina: 82 } },
    239: { name: "Eryx Lorvik", pos: "LWF", rarity: "Premium", ovr: 126, stats: { speed: 87, shooting: 79, passing: 80, ball_control: 82, dribbling: 84, defense: 67, physical: 79, stamina: 83 } },
    240: { name: "Torik Valtor", pos: "CF", rarity: "Premium", ovr: 125, stats: { speed: 85, shooting: 81, passing: 76, ball_control: 80, dribbling: 83, defense: 63, physical: 80, stamina: 81 } },
    241: { name: "Ravon Dexel", pos: "GK", rarity: "Premium", ovr: 125, stats: { gk_diving: 84, gk_reflexes: 83, gk_handling: 82, gk_positioning: 81, gk_kicking: 79, physical: 80, stamina: 83 } },
    242: { name: "Daren Molvik", pos: "CB", rarity: "Premium", ovr: 124, stats: { speed: 73, shooting: 68, passing: 72, ball_control: 71, dribbling: 70, defense: 83, physical: 82, stamina: 79 } },
    243: { name: "Lyron Valtrex", pos: "RB", rarity: "Premium", ovr: 124, stats: { speed: 83, shooting: 71, passing: 76, ball_control: 77, dribbling: 79, defense: 79, physical: 78, stamina: 80 } },
    244: { name: "Mavrix Veyron", pos: "LB", rarity: "Premium", ovr: 124, stats: { speed: 82, shooting: 70, passing: 75, ball_control: 76, dribbling: 78, defense: 78, physical: 77, stamina: 79 } },
    245: { name: "Zylen Lorik", pos: "DMF", rarity: "Premium", ovr: 123, stats: { speed: 77, shooting: 72, passing: 77, ball_control: 76, dribbling: 74, defense: 81, physical: 80, stamina: 78 } },
    246: { name: "Cairon Dexel", pos: "CMF", rarity: "Premium", ovr: 123, stats: { speed: 78, shooting: 73, passing: 78, ball_control: 77, dribbling: 75, defense: 79, physical: 78, stamina: 79 } },
    247: { name: "Tavrix Valtor", pos: "AMF", rarity: "Premium", ovr: 122, stats: { speed: 80, shooting: 75, passing: 80, ball_control: 79, dribbling: 78, defense: 76, physical: 77, stamina: 78 } },
    248: { name: "Eryx Falven", pos: "RWF", rarity: "Premium", ovr: 122, stats: { speed: 85, shooting: 77, passing: 78, ball_control: 80, dribbling: 82, defense: 64, physical: 76, stamina: 80 } },
    249: { name: "Loran Veyron", pos: "LWF", rarity: "Premium", ovr: 122, stats: { speed: 86, shooting: 78, passing: 79, ball_control: 81, dribbling: 83, defense: 65, physical: 77, stamina: 81 } },
    250: { name: "Torik Dexel", pos: "CF", rarity: "Premium", ovr: 121, stats: { speed: 84, shooting: 80, passing: 75, ball_control: 79, dribbling: 82, defense: 61, physical: 78, stamina: 79 } }
};

// --- TEAM GENERATION CONDITIONS ---
const TEAM_NAMES = [
    'Astrix FC',
    'Velmor United',
    'Kaysen Rovers',
    'Zypher Athletic',
    'Nerova SC',
    'Orvion City',
    'Caldris FC',
    'Virex United',
    'Lunaris Athletic',
    'Torvane FC',
    'Helixon SC',
    'Bravex Rovers',
    'Mythra United',
    'Auren City'
];

const TEAM_PLAYER_COUNT = 18;

const STARTER_POSITIONS = [
    'GK',
    'RB',
    'CB',
    'CB',
    'LB',
    'CDM',
    'CM',
    'CAM',
    'RW',
    'LW',
    'ST'
];

const TEAM_RARITIES = [
    'Standard',
    'Rare',
    'Epic',
    'Iconic',
    'Legendary',
    'Premium',
    'Premium Legend'
];

const PREMIUM_LEGEND_PER_TEAM = 1;

// --- HELPERS ---
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateName() {
    return `${FIRST_NAMES[getRandomInt(0, FIRST_NAMES.length - 1)]} ${LAST_NAMES[getRandomInt(0, LAST_NAMES.length - 1)]}`;
}

function generateRandomStats(position, rarity) {
    let base = 60;
    if (rarity === 'Rare') base = 70;
    if (rarity === 'Epic') base = 80;
    if (rarity === 'Legendary') base = 85;

    const stats = {
        shooting: getRandomInt(base, base + 10),
        passing: getRandomInt(base, base + 10),
        dribbling: getRandomInt(base, base + 10),
        ball_control: getRandomInt(base, base + 10),
        defense: getRandomInt(base - 10, base + 5),
        speed: getRandomInt(base, base + 10),
        physical: getRandomInt(base, base + 10),
        stamina: getRandomInt(base, base + 15),
        gk_reflexes: 10,
        gk_handling: 10,
        gk_diving: 10,
        gk_positioning: 10,
        gk_kicking: 10
    };

    // Adjust based on position
    if (position === 'GK') {
        stats.shooting = getRandomInt(30, 50);
        stats.passing = getRandomInt(50, 70);
        stats.dribbling = getRandomInt(30, 50);
        stats.ball_control = getRandomInt(40, 60);
        stats.defense = getRandomInt(40, 60); 
        
        stats.gk_reflexes = getRandomInt(base, base + 10);
        stats.gk_handling = getRandomInt(base, base + 10);
        stats.gk_diving = getRandomInt(base, base + 10);
        stats.gk_positioning = getRandomInt(base, base + 10);
        stats.gk_kicking = getRandomInt(base, base + 10);
    } else if (['CB', 'LB', 'RB'].includes(position)) {
        stats.defense = getRandomInt(base + 10, base + 20);
        stats.shooting = getRandomInt(base - 10, base);
        stats.physical = getRandomInt(base + 5, base + 15);
    } else if (['DMF', 'CMF'].includes(position)) {
        stats.passing = getRandomInt(base + 10, base + 15);
        stats.stamina = getRandomInt(base + 10, base + 20);
    } else if (['CF', 'SS', 'LWF', 'RWF', 'AMF'].includes(position)) {
        stats.shooting = getRandomInt(base + 10, base + 20);
        stats.speed = getRandomInt(base + 5, base + 15);
        stats.dribbling = getRandomInt(base + 5, base + 15);
        stats.defense = getRandomInt(base - 20, base - 5);
    }

    return stats;
}

function calculateOVR(stats, position) {
    if (position === 'GK') {
        return Math.floor((stats.gk_reflexes + stats.gk_handling + stats.gk_diving + stats.gk_positioning + stats.physical) / 5);
    }
    return Math.floor((stats.shooting + stats.passing + stats.dribbling + stats.defense + stats.speed + stats.physical) / 6);
}

// --- MAIN GENERATION ---
const players = [];

for (let i = 1; i <= 252; i++) {
    const id = `PLAYER_${String(i).padStart(3, '0')}`;
    let player = {};

    if (PREDEFINED[i]) {
        // Use predefined data
        const p = PREDEFINED[i];
        player = {
            id,
            name: p.name,
            position: p.pos,
            rarity: p.rarity,
            ovr: p.ovr,
            stats: p.stats,
            skills: ['Heel Trick', 'First Time Shot', 'Fighting Spirit'] // Default skills
        };
        
        // Fill missing stats for predefined (like GK stats for outfield)
        if (player.position !== 'GK') {
            player.stats.gk_reflexes = 10;
            player.stats.gk_handling = 10;
            player.stats.gk_diving = 10;
            player.stats.gk_positioning = 10;
            player.stats.gk_kicking = 10;
        } else {
             // ensure outfield stats exist
             if (!player.stats.shooting) player.stats.shooting = 40;
             if (!player.stats.passing) player.stats.passing = 60;
             if (!player.stats.dribbling) player.stats.dribbling = 40;
             if (!player.stats.ball_control) player.stats.ball_control = 50;
             if (!player.stats.defense) player.stats.defense = 50;
             if (!player.stats.speed) player.stats.speed = 60;
        }

    } else {
        // Generate Random Player
        let rarity = 'Standard';
        let pos = 'CMF';
        
        // Distribution
        if (i <= 100) rarity = 'Standard';
        else if (i <= 180) rarity = 'Rare';
        else if (i <= 200) rarity = 'Epic';
        else if (i > 240) rarity = 'Premium'; // 241-250 are Premium placeholders

        // Position Cycle
        const positions = ['GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'AMF', 'LWF', 'RWF', 'CF', 'SS'];
        pos = positions[i % positions.length];

        const stats = generateRandomStats(pos, rarity);
        let ovr = calculateOVR(stats, pos);
        
        // Boost OVR based on rarity
        if (rarity === 'Standard') ovr = getRandomInt(60, 74);
        if (rarity === 'Rare') ovr = getRandomInt(75, 84);
        if (rarity === 'Epic') ovr = getRandomInt(85, 94);
        if (rarity === 'Legendary') ovr = getRandomInt(95, 99);

        player = {
            id,
            name: generateName(),
            position: pos,
            rarity,
            ovr,
            stats,
            skills: ['Cut Behind', 'Step On Control']
        };
    }

    players.push(player);
}

// Ensure directory exists
const dir = path.dirname(OUTPUT_PATH);
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(players, null, 2));
console.log(`Successfully generated ${players.length} players to ${OUTPUT_PATH}`);
