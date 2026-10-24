export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const formatTime = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

// Used by both the webcam and demo modes.
export class AttentionSession {
  constructor({ fadeStart = 6, fadeDuration = 12, absenceGrace = 1.2, returnDwell = 0.6 } = {}) {
    Object.assign(this, { fadeStart, fadeDuration, absenceGrace, returnDwell });
    this.elapsed = 0; this.total = 0; this.streak = 0; this.longest = 0;
    this.away = 0; this.dwell = 0; this.visits = 0; this.returns = 0;
    this.inVisit = false; this.visibility = 1; this.fragmentation = 0;
  }
  update(dt, attentive, proximity = 0) {
    dt = clamp(dt, 0, 0.25); // Cap large time jumps when the tab was inactive.
    this.elapsed += dt;
    let returned = false;
    if (attentive) {
      this.total += dt; this.streak += dt; this.dwell += dt; this.away = 0;
      this.longest = Math.max(this.longest, this.streak);
      if (!this.inVisit && this.dwell >= this.returnDwell) {
        this.inVisit = true; this.visits++;
        if (this.visits > 1) { this.returns++; returned = true; }
      }
    } else {
      this.away += dt; this.dwell = 0;
      if (this.away >= this.absenceGrace) { this.streak = 0; this.inVisit = false; }
    }
    const target = 1 - 0.92 * clamp((this.streak - this.fadeStart) / this.fadeDuration, 0, 1);
    this.visibility += (target - this.visibility) * Math.min(1, dt * 3);
    this.fragmentation += (proximity - this.fragmentation) * Math.min(1, dt * 4);
    return { returned, state: this.fragmentation > 0.15 ? 'fragmented' : this.visibility < 0.97 ? 'fading' : 'clear' };
  }
  summary(mode) {
    return { mode, estimatedLookingSeconds: +this.total.toFixed(2), longestLookSeconds: +this.longest.toFixed(2), returns: this.returns, activeSessionSeconds: +this.elapsed.toFixed(2), attentionMethod: 'Face presence and approximate frontal head orientation; not eye gaze.' };
  }
}
