let audioCtx: AudioContext | null = null;
let tickAudio: HTMLAudioElement | null = null;
let revealAudio: HTMLAudioElement | null = null;
let upgradeSuccessAudio: HTMLAudioElement | null = null;
let upgradeFailAudio: HTMLAudioElement | null = null;
let upgradeSpinAudio: HTMLAudioElement | null = null;
let licenseResultAudio: HTMLAudioElement | null = null;
let licenseResultTimer: number | null = null;

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
        // Local path so it never expires: Requires user to upload file to public/audio/
        upgradeSuccessAudio = new Audio("/audio/upgrade_success.mp3");
        upgradeSuccessAudio.volume = 1.0;
        upgradeSuccessAudio.loop = false;
    }
    if (!upgradeFailAudio) {
        // Local path so it never expires: Requires user to upload file to public/audio/
        upgradeFailAudio = new Audio("/audio/upgrade_fail.mp3");
        upgradeFailAudio.volume = 1.0;
        upgradeFailAudio.loop = false;
    }

    // Unlock audio context for mobile browsers by playing and immediately pausing
    [tickAudio, revealAudio, upgradeSuccessAudio, upgradeFailAudio].forEach(audio => {
        if (audio && audio.paused) {
            audio.play().catch(() => {});
            audio.pause();
            audio.currentTime = 0;
        }
    });
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

const playLicenseResultSound = (source: HTMLAudioElement | null) => {
    if (!source) return;

    if (licenseResultTimer !== null) {
        window.clearTimeout(licenseResultTimer);
        licenseResultTimer = null;
    }
    if (licenseResultAudio) {
        licenseResultAudio.pause();
    }

    const audio = source.cloneNode() as HTMLAudioElement;
    licenseResultAudio = audio;
    audio.currentTime = 0;
    audio.volume = 0.9;
    audio.play().catch(console.error);

    licenseResultTimer = window.setTimeout(() => {
        const fade = window.setInterval(() => {
            audio.volume = Math.max(0, audio.volume - 0.18);
            if (audio.volume === 0) {
                window.clearInterval(fade);
                audio.pause();
                audio.currentTime = 0;
                if (licenseResultAudio === audio) licenseResultAudio = null;
            }
        }, 30);
        licenseResultTimer = null;
    }, 1050);
};

export const playLicenseSuccessSound = () => playLicenseResultSound(upgradeSuccessAudio);

export const playLicenseFailSound = () => playLicenseResultSound(upgradeFailAudio);
