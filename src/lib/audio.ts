let audioCtx: AudioContext | null = null;
let tickAudio: HTMLAudioElement | null = null;
let revealAudio: HTMLAudioElement | null = null;
let upgradeSuccessAudio: HTMLAudioElement | null = null;
let upgradeFailAudio: HTMLAudioElement | null = null;
let upgradeSpinAudio: HTMLAudioElement | null = null;

export const initAudio = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }

    // Preload real CS:GO sounds
    if (!tickAudio) {
        tickAudio = new Audio("https://raw.githubusercontent.com/joshuadun/CSGO-Case-Simulator/master/audio/csgo_ui_crate_item_scroll.wav");
        tickAudio.volume = 0.4;
    }
    if (!revealAudio) {
        revealAudio = new Audio("https://raw.githubusercontent.com/joshuadun/CSGO-Case-Simulator/master/audio/csgo_ui_crate_item_reveal.wav");
        revealAudio.volume = 0.6;
    }
    if (!upgradeSuccessAudio) {
        // A cool success sound
        upgradeSuccessAudio = new Audio("https://cdn.discordapp.com/attachments/1492459270564741273/1493452969591574660/eef675f4f58e129c.mp3?ex=69dfaeb6&is=69de5d36&hm=85fcb7335be11ae38b15e976aab72c03e9268a5e03b7493cd8ffe568e2bc733f&v=2");
        upgradeSuccessAudio.volume = 1.0;
        upgradeSuccessAudio.loop = false;
    }
    if (!upgradeFailAudio) {
        // The requested fail sound
        upgradeFailAudio = new Audio("https://cdn.discordapp.com/attachments/1492459270564741273/1493452983143366666/sound.mp3?ex=69dfaeba&is=69de5d3a&hm=90d258be74a6fd2ed2c4b7a0d0609e059535fcc2c4ebc636a6ec8f67b81e9d3e&v=2");
        upgradeFailAudio.volume = 1.0;
        upgradeFailAudio.loop = false;
    }
};

export const playUpgradeSpinSound = () => {
    // We removed the long spin sound, so we just play a tick or nothing.
    // Let's just play a tick to indicate it started.
    playTickSound();
};

export const fadeOutUpgradeSpinSound = () => {
    // No-op
};

export const stopUpgradeSpinSound = () => {
    // No-op
};

export const playTickSound = () => {
    if (tickAudio) {
        // Clone node to allow overlapping sounds (rapid ticks)
        const clone = tickAudio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.4;
        clone.play().catch(console.error);
    }
};

export const playRevealSound = () => {
    if (revealAudio) {
        const clone = revealAudio.cloneNode() as HTMLAudioElement;
        clone.volume = 0.6;
        clone.play().catch(console.error);
    }
};

export const playUpgradeSuccessSound = () => {
    if (upgradeSuccessAudio) {
        upgradeSuccessAudio.pause();
        upgradeSuccessAudio.currentTime = 0;
        upgradeSuccessAudio.play().catch(console.error);
    }
};

export const playUpgradeFailSound = () => {
    if (upgradeFailAudio) {
        upgradeFailAudio.pause();
        upgradeFailAudio.currentTime = 0;
        upgradeFailAudio.play().catch(console.error);
    }
};
