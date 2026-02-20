let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let commentaryGain: GainNode | null = null;

let lastSettings = {
    masterVolume: 1,
    soundEnabled: true,
    musicEnabled: true,
    commentaryEnabled: true,
    commentaryCrowdBalance: 0.5
};

let currentMatchIntensity = 0.3;
let currentDerby = false;

type AudioChannel = 'sfx' | 'music' | 'commentary';

const ensureContext = () => {
    if (typeof window === 'undefined') return;
    if (audioContext) return;
    const Ctor = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
    if (!Ctor) return;
    audioContext = new Ctor();
    masterGain = audioContext.createGain();
    sfxGain = audioContext.createGain();
    musicGain = audioContext.createGain();
    commentaryGain = audioContext.createGain();
    sfxGain.connect(masterGain);
    musicGain.connect(masterGain);
    commentaryGain.connect(masterGain);
    masterGain.connect(audioContext.destination);
};

const getGainForChannel = (channel: AudioChannel) => {
    if (channel === 'sfx') return sfxGain;
    if (channel === 'music') return musicGain;
    return commentaryGain;
};

const applyGains = () => {
    ensureContext();
    if (!audioContext || !masterGain || !sfxGain || !musicGain || !commentaryGain) return;
    const master = Math.max(0, Math.min(1, lastSettings.masterVolume));
    const balance = Math.max(0, Math.min(1, lastSettings.commentaryCrowdBalance));
    const crowdBias = balance;
    const commentaryBias = 1 - balance;
    const intensity = Math.max(0, Math.min(1, currentMatchIntensity));
    const derbyBoost = currentDerby ? 1 : 0;
    const crowdAggression = 1 + intensity * 0.25 + derbyBoost * 0.3;
    const commentaryTension = 1 + intensity * 0.1 - derbyBoost * 0.15;
    const baseSfx = lastSettings.soundEnabled ? (0.7 + 0.3 * crowdBias) : 0;
    const baseMusic = lastSettings.musicEnabled ? 1 : 0;
    const baseCommentary = lastSettings.commentaryEnabled ? (0.7 + 0.3 * commentaryBias) : 0;
    const sfxValue = Math.max(0, Math.min(1.5, baseSfx * crowdAggression));
    const commentaryValue = Math.max(0, Math.min(1.5, baseCommentary * commentaryTension));
    masterGain.gain.value = master;
    sfxGain.gain.value = master * sfxValue;
    musicGain.gain.value = master * baseMusic;
    commentaryGain.gain.value = master * commentaryValue;
};

export const AudioManager = {
    setSettings(params: {
        masterVolume: number;
        soundEnabled: boolean;
        musicEnabled: boolean;
        commentaryEnabled: boolean;
        commentaryCrowdBalance: number;
    }) {
        lastSettings = {
            masterVolume: params.masterVolume,
            soundEnabled: params.soundEnabled,
            musicEnabled: params.musicEnabled,
            commentaryEnabled: params.commentaryEnabled,
            commentaryCrowdBalance: params.commentaryCrowdBalance
        };
        applyGains();
    },
    setMatchState(params: { intensity: number; derby: boolean }) {
        currentMatchIntensity = params.intensity;
        currentDerby = params.derby;
        applyGains();
    },
    async playBufferedSound(channel: AudioChannel, buffer: AudioBuffer) {
        ensureContext();
        if (!audioContext) return;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        const gain = getGainForChannel(channel);
        if (!gain) return;
        source.connect(gain);
        source.start(0);
    },
    async loadAndPlay(channel: AudioChannel, url: string) {
        ensureContext();
        if (!audioContext) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const buffer = await audioContext.decodeAudioData(arrayBuffer);
            this.playBufferedSound(channel, buffer);
        } catch {
        }
    }
};
