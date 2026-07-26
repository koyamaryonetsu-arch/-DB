// 完全オリジナルの合成サウンド（WebAudio）。外部音源は一切使わない。
// BGM は短い自作ループ、効果音は矩形波/ノイズの合成。

import { G } from '../store';

type NoteEvent = [midi: number, beats: number]; // midi 0 = 休符

interface BgmDef {
  bpm: number;
  lead: NoteEvent[];
  bass?: NoteEvent[];
}

// すべて本作のために作曲した短いオリジナルループ
const BGM: Record<string, BgmDef> = {
  bgm_title: {
    bpm: 72,
    lead: [
      [69, 1.5], [72, 0.5], [76, 2], [74, 1], [72, 1], [69, 2],
      [67, 1.5], [69, 0.5], [72, 2], [71, 1], [67, 1], [64, 2],
    ],
    bass: [[45, 4], [43, 4], [41, 4], [40, 4]],
  },
  bgm_village: {
    bpm: 96,
    lead: [
      [72, 1], [74, 0.5], [76, 0.5], [77, 1], [76, 0.5], [74, 0.5],
      [72, 1], [69, 1], [67, 2],
      [69, 1], [72, 0.5], [74, 0.5], [76, 1], [74, 0.5], [72, 0.5], [69, 2],
    ],
    bass: [[48, 2], [45, 2], [43, 2], [45, 2], [48, 2], [45, 2], [43, 2], [43, 2]],
  },
  bgm_field: {
    bpm: 112,
    lead: [
      [64, 1], [67, 1], [71, 1], [72, 1], [71, 0.5], [69, 0.5], [67, 1], [64, 1],
      [62, 1], [64, 1], [67, 2],
      [64, 1], [67, 1], [71, 1], [74, 1], [72, 0.5], [71, 0.5], [69, 1], [67, 1], [64, 2],
    ],
    bass: [[40, 2], [43, 2], [45, 2], [47, 2], [40, 2], [43, 2], [45, 2], [40, 2]],
  },
  bgm_forest: {
    bpm: 84,
    lead: [
      [62, 1.5], [65, 0.5], [69, 2], [67, 1], [65, 1], [62, 1], [60, 1],
      [58, 1.5], [62, 0.5], [65, 2], [63, 1], [62, 1], [58, 2],
    ],
    bass: [[38, 4], [36, 4], [34, 4], [38, 4]],
  },
  bgm_battle: {
    bpm: 140,
    lead: [
      [57, 0.5], [60, 0.5], [64, 0.5], [67, 0.5], [65, 0.5], [64, 0.5], [62, 0.5], [60, 0.5],
      [57, 0.5], [60, 0.5], [64, 0.5], [69, 0.5], [67, 1], [64, 1],
      [55, 0.5], [59, 0.5], [62, 0.5], [65, 0.5], [64, 0.5], [62, 0.5], [59, 0.5], [55, 0.5],
    ],
    bass: [[33, 1], [33, 1], [36, 1], [36, 1], [31, 1], [31, 1], [33, 1], [33, 1]],
  },
  bgm_boss: {
    bpm: 152,
    lead: [
      [50, 0.5], [50, 0.5], [53, 0.5], [56, 0.5], [55, 0.5], [53, 0.5], [50, 0.5], [50, 0.5],
      [50, 0.5], [53, 0.5], [56, 0.5], [58, 0.5], [59, 1], [56, 0.5], [53, 0.5],
      [48, 0.5], [48, 0.5], [51, 0.5], [55, 0.5], [53, 1], [50, 1],
    ],
    bass: [[26, 1], [26, 1], [29, 1], [26, 1], [26, 1], [31, 1], [29, 1], [26, 1]],
  },
  bgm_ending: {
    bpm: 66,
    lead: [
      [72, 2], [76, 1], [79, 1], [77, 2], [76, 1], [74, 1],
      [72, 2], [69, 1], [72, 1], [74, 4],
    ],
    bass: [[48, 4], [45, 4], [41, 4], [43, 4]],
  },
};

function midiFreq(m: number): number {
  return 440 * Math.pow(2, (m - 69) / 12);
}

class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmTimer: number | null = null;
  private currentBgm: string | null = null;
  private bgmGain: GainNode | null = null;

  private ensureCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  /** 最初のユーザー操作で呼ぶ */
  unlock(): void {
    this.ensureCtx();
  }

  // ---- 効果音 ----
  private tone(freq: number, dur: number, type: OscillatorType, vol: number, slideTo?: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const v = vol * G.settings.seVol;
    if (v <= 0) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slideTo) osc.frequency.linearRampToValueAtTime(slideTo, ctx.currentTime + dur);
    gain.gain.setValueAtTime(v, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur + 0.02);
  }

  private noise(dur: number, vol: number): void {
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const v = vol * G.settings.seVol;
    if (v <= 0) return;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(v, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(gain).connect(ctx.destination);
    src.start();
  }

  sfx(name: string): void {
    switch (name) {
      case 'cursor':
        this.tone(880, 0.05, 'square', 0.12);
        break;
      case 'confirm':
        this.tone(660, 0.06, 'square', 0.14);
        this.tone(990, 0.09, 'square', 0.12);
        break;
      case 'cancel':
        this.tone(330, 0.09, 'square', 0.12);
        break;
      case 'buzzer':
        this.tone(160, 0.15, 'sawtooth', 0.14);
        break;
      case 'hit':
        this.noise(0.12, 0.2);
        this.tone(180, 0.1, 'square', 0.1, 90);
        break;
      case 'crit':
        this.noise(0.16, 0.25);
        this.tone(340, 0.16, 'sawtooth', 0.16, 80);
        break;
      case 'heal':
        this.tone(660, 0.08, 'sine', 0.14);
        this.tone(880, 0.1, 'sine', 0.13);
        this.tone(1100, 0.16, 'sine', 0.12);
        break;
      case 'spell':
        this.tone(500, 0.22, 'triangle', 0.15, 1400);
        break;
      case 'levelup':
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => this.tone(f, 0.14, 'square', 0.13), i * 90)
        );
        break;
      case 'battlestart':
        this.tone(700, 0.3, 'sawtooth', 0.14, 120);
        break;
      case 'chest':
        this.tone(587, 0.08, 'square', 0.13);
        this.tone(880, 0.14, 'square', 0.12);
        break;
      case 'save':
        this.tone(784, 0.1, 'sine', 0.13);
        this.tone(1046, 0.16, 'sine', 0.12);
        break;
      case 'combo':
        this.tone(440, 0.08, 'square', 0.14);
        this.tone(660, 0.08, 'square', 0.14);
        this.tone(880, 0.14, 'square', 0.15);
        break;
      case 'ko':
        this.tone(220, 0.25, 'sawtooth', 0.14, 60);
        break;
      case 'step':
        this.tone(200, 0.03, 'square', 0.03);
        break;
    }
  }

  // ---- BGM ----
  playBgm(name: string): void {
    if (this.currentBgm === name) return;
    this.stopBgm();
    const def = BGM[name];
    if (!def) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    this.currentBgm = name;
    this.bgmGain = ctx.createGain();
    this.bgmGain.gain.value = 0.06 * G.settings.bgmVol;
    this.bgmGain.connect(ctx.destination);

    const beatSec = 60 / def.bpm;
    let nextTime = ctx.currentTime + 0.05;
    let leadIdx = 0;
    let bassTime = ctx.currentTime + 0.05;
    let bassIdx = 0;

    const schedule = () => {
      const gain = this.bgmGain;
      if (!gain || this.currentBgm !== name) return;
      gain.gain.value = 0.06 * G.settings.bgmVol;
      const horizon = ctx.currentTime + 0.6;
      while (nextTime < horizon) {
        const [midi, beats] = def.lead[leadIdx % def.lead.length];
        const dur = beats * beatSec;
        if (midi > 0) this.scheduleNote(ctx, gain, midiFreq(midi), nextTime, dur * 0.9, 'square', 1);
        nextTime += dur;
        leadIdx++;
      }
      if (def.bass) {
        while (bassTime < horizon) {
          const [midi, beats] = def.bass[bassIdx % def.bass.length];
          const dur = beats * beatSec;
          if (midi > 0) this.scheduleNote(ctx, gain, midiFreq(midi), bassTime, dur * 0.95, 'triangle', 0.9);
          bassTime += dur;
          bassIdx++;
        }
      }
    };
    schedule();
    this.bgmTimer = window.setInterval(schedule, 250);
  }

  private scheduleNote(
    ctx: AudioContext,
    out: GainNode,
    freq: number,
    at: number,
    dur: number,
    type: OscillatorType,
    vol: number
  ): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.linearRampToValueAtTime(vol, at + 0.01);
    gain.gain.setValueAtTime(vol, at + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, at + dur);
    osc.connect(gain).connect(out);
    osc.start(at);
    osc.stop(at + dur + 0.05);
  }

  stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain) {
      try {
        this.bgmGain.disconnect();
      } catch {}
      this.bgmGain = null;
    }
    this.currentBgm = null;
  }
}

export const sound = new SoundManager();
