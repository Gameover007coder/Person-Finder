// audio.js - Synthesized Web Audio API Manager for SocialFinder OSINT

class OSINTSynth {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem("osint_muted") === "true";
    this.scanOsc = null;
    this.scanGain = null;
    this.scanLfo = null;
    this.scanFilter = null;
  }

  // Lazily initialize AudioContext due to browser auto-play policies
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn("Web Audio API is not supported in this browser:", e);
    }
  }

  // Save mute configuration
  setMute(state) {
    this.isMuted = state;
    localStorage.setItem("osint_muted", state ? "true" : "false");
    if (state && this.ctx) {
      this.stopScan();
    }
  }

  // Play a brief cybernetic hover click
  playClick() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    // Rapid pitch drop to simulate a mechanical click
    osc.frequency.setValueAtTime(2200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.04);

    gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Play a click/beep for button presses or selections
  playSelect() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    // Dual-tone digital beep
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
    osc1.frequency.exponentialRampToValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6

    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(493.88, this.ctx.currentTime); // B4
    osc2.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.08); // E5

    gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 0.1);
    osc2.stop(this.ctx.currentTime + 0.1);
  }

  // Play the rising sweep when starting the scan
  playScanStart() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 0.5);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);

    // Initialize scan hum loop shortly after start
    setTimeout(() => this.startScanHum(), 450);
  }

  // Continuous scanner background drone
  startScanHum() {
    if (this.isMuted || !this.ctx || this.scanOsc) return;

    this.scanOsc = this.ctx.createOscillator();
    this.scanGain = this.ctx.createGain();
    this.scanFilter = this.ctx.createBiquadFilter();
    this.scanLfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    // Drone oscillator (sawtooth/triangle blend via lowpass filtering)
    this.scanOsc.type = "triangle";
    this.scanOsc.frequency.value = 85; // Low frequency base drone

    // Filter to shape the drone
    this.scanFilter.type = "bandpass";
    this.scanFilter.Q.value = 4.0;
    this.scanFilter.frequency.value = 350;

    // LFO to modulate the filter frequency for a whirring/pulsing effect
    this.scanLfo.type = "sine";
    this.scanLfo.frequency.value = 3.5; // Modulates 3.5 times per second
    lfoGain.gain.value = 220; // Modulation range (+/- 220Hz)

    // Master scanner gain
    this.scanGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    // Connections
    this.scanLfo.connect(lfoGain);
    lfoGain.connect(this.scanFilter.frequency);
    
    this.scanOsc.connect(this.scanFilter);
    this.scanFilter.connect(this.scanGain);
    this.scanGain.connect(this.ctx.destination);

    // Start oscillators
    this.scanOsc.start();
    this.scanLfo.start();
  }

  // Stop scanner audio loop and fade out cleanly
  stopScan() {
    if (!this.ctx) return;
    
    const fadeTime = 0.15;
    if (this.scanGain) {
      try {
        this.scanGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.scanGain.gain.setValueAtTime(this.scanGain.gain.value, this.ctx.currentTime);
        this.scanGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + fadeTime);
      } catch (e) {
        // Fallback in case of scheduling edge cases
        this.scanGain.gain.value = 0;
      }
    }

    const osc = this.scanOsc;
    const lfo = this.scanLfo;

    this.scanOsc = null;
    this.scanGain = null;
    this.scanLfo = null;
    this.scanFilter = null;

    if (osc && lfo) {
      setTimeout(() => {
        try {
          osc.stop();
          lfo.stop();
        } catch (e) {}
      }, fadeTime * 1000 + 50);
    }
  }

  // Futuristic digital arpeggio for successful match
  playSuccess() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    // Notes: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const time = this.ctx.currentTime;

    notes.forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time + index * 0.06);

      gainNode.gain.setValueAtTime(0.05, time + index * 0.06);
      gainNode.gain.setValueAtTime(0.05, time + index * 0.06 + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + index * 0.06 + 0.22);

      osc.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      osc.start(time + index * 0.06);
      osc.stop(time + index * 0.06 + 0.25);
    });
  }

  // Descending, dissonant error buzz for failure
  playFailure() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === "suspended") this.ctx.resume();

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gainNode = this.ctx.createGain();

    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(140, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(70, this.ctx.currentTime + 0.35);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }
}

// Export a single instance to share state across components
export const synth = new OSINTSynth();
export default synth;
