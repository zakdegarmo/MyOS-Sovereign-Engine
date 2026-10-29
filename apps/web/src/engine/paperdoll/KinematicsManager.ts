/**
 * KinematicsManager.ts
 * 
 * Manages 8-way continuous phase progression, Core Trilogy (idle, walk, run) action states,
 * compass angle mapping, and keyboard interaction hotkeys.
 */

import { PaperdollDirection, PaperdollAction } from './PaperdollCompositor';

export interface ActionTimingConfig {
  durationMs: number;
  frames: number;
  loop: boolean;
}

export const CORE_TRILOGY_TIMINGS: Record<PaperdollAction, ActionTimingConfig> = {
  idle: { durationMs: 1200, frames: 8, loop: true },
  walk: { durationMs: 800, frames: 8, loop: true },
  run: { durationMs: 500, frames: 8, loop: true }
};

export class KinematicsManager {
  private currentAction: PaperdollAction = 'walk';
  private currentDirection: PaperdollDirection = 'S';
  private isPaused: boolean = false;
  private phaseAccumulator: number = 0; // 0.0 to 1.0 continuous phase

  constructor(initialAction: PaperdollAction = 'walk', initialDirection: PaperdollDirection = 'S') {
    this.currentAction = initialAction;
    this.currentDirection = initialDirection;
  }

  public setAction(action: PaperdollAction): void {
    if (this.currentAction !== action) {
      this.currentAction = action;
      // Phase remains continuous to prevent jarring animation snapping
    }
  }

  public getAction(): PaperdollAction {
    return this.currentAction;
  }

  public setDirection(direction: PaperdollDirection): void {
    this.currentDirection = direction;
  }

  public getDirection(): PaperdollDirection {
    return this.currentDirection;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * Update animation phase by delta time (in seconds)
   * Returns current integer frame index [0..7]
   */
  public update(deltaSeconds: number): number {
    if (this.isPaused) {
      const timing = CORE_TRILOGY_TIMINGS[this.currentAction];
      return Math.floor(this.phaseAccumulator * timing.frames) % timing.frames;
    }

    const timing = CORE_TRILOGY_TIMINGS[this.currentAction];
    const durationSec = timing.durationMs / 1000;
    this.phaseAccumulator = (this.phaseAccumulator + (deltaSeconds / durationSec)) % 1.0;

    return Math.floor(this.phaseAccumulator * timing.frames) % timing.frames;
  }

  public getPhase(): number {
    return this.phaseAccumulator;
  }

  /**
   * Map angle in radians [-PI, PI] to 8-directional compass sector
   */
  public static angleToDirection(radians: number): PaperdollDirection {
    // Normalize to [0, 2*PI)
    let norm = radians % (Math.PI * 2);
    if (norm < 0) norm += Math.PI * 2;

    // Sectors: 8 sectors of 45 deg (PI / 4)
    // 0 deg = South (down) in screen space
    const sector = Math.round(norm / (Math.PI / 4)) % 8;
    const sectors: PaperdollDirection[] = ['S', 'SW', 'W', 'NW', 'N', 'NE', 'E', 'SE'];
    return sectors[sector] || 'S';
  }

  /**
   * Handle hotkeys (1, 2, 3, Space)
   */
  public handleKeyDown(key: string): boolean {
    switch (key) {
      case '1':
        this.setAction('idle');
        return true;
      case '2':
        this.setAction('walk');
        return true;
      case '3':
        this.setAction('run');
        return true;
      case ' ':
        this.togglePause();
        return true;
      default:
        return false;
    }
  }
}
