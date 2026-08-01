let audioCtx: AudioContext | null = null;
let tickAudio: HTMLAudioElement | null = null;
let revealAudio: HTMLAudioElement | null = null;
let upgradeSuccessAudio: HTMLAudioElement | null = null;
let upgradeFailAudio: HTMLAudioElement | null = null;
let upgradeSpinAudio: HTMLAudioElement | null = null;
let licenseSuccessAudio: HTMLAudioElement | null = null;
let licenseFailAudio: HTMLAudioElement | null = null;
let licenseResultAudio: HTMLAudioElement | null = null;

const resumeAudioContext = () => {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
};

const unlockAudio = (audio: HTMLAudioElement | null) => {
    if (audio && audio.paused) {
        audio.play().catch(() => {});
        audio.pause();
        audio.currentTime = 0;
    }
};

export const initAudio = () => {
    resumeAudioContext();

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
    [tickAudio, revealAudio, upgradeSuccessAudio, upgradeFailAudio].forEach(unlockAudio);
};

export const initLicenseAudio = () => {
    resumeAudioContext();

    if (!licenseSuccessAudio) {
        licenseSuccessAudio = new Audio("/audio/license_success.mp3?v=2");
        licenseSuccessAudio.volume = 0.9;
        licenseSuccessAudio.loop = false;
        licenseSuccessAudio.preload = "auto";
    }
    if (!licenseFailAudio) {
        licenseFailAudio = new Audio("/audio/license_fail.mp3?v=2");
        licenseFailAudio.volume = 0.9;
        licenseFailAudio.loop = false;
        licenseFailAudio.preload = "auto";
    }

    [licenseSuccessAudio, licenseFailAudio].forEach(unlockAudio);
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

    if (licenseResultAudio) {
        licenseResultAudio.pause();
    }

    const audio = source.cloneNode() as HTMLAudioElement;
    licenseResultAudio = audio;
    audio.volume = 0.9;
    audio.currentTime = 0;

    audio.addEventListener("ended", () => {
        if (licenseResultAudio === audio) licenseResultAudio = null;
    }, { once: true });

    audio.play().catch(console.error);
};

export const playLicenseSuccessSound = () => playLicenseResultSound(licenseSuccessAudio);

export const playLicenseFailSound = () => playLicenseResultSound(licenseFailAudio);
