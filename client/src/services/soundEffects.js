/**
 * Sound Effects Service
 *
 * Provides sound effect playback for the chat bubble system.
 * Currently stubbed with console logging.
 * Future implementation will support .wav file playback.
 */

class SoundEffectsService {
  constructor() {
    this.enabled = true;
    this.volume = 0.5;
    // TODO: Load .wav files when implementing actual sound
    this.sounds = {
      bubblePopIn: null,   // TODO: Load bubble-pop-in.wav
      bubblePopOut: null,  // TODO: Load bubble-pop-out.wav
      aiVoice1: null,      // TODO: Load character voice sounds
      aiVoice2: null,
      aiVoice3: null,
      aiVoice4: null,
      aiVoice5: null
    };
  }

  /**
   * Enable or disable all sound effects
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`[Sound] Sound effects ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set master volume for all sounds
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    console.log(`[Sound] Volume set to ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Play the bubble pop-in sound effect
   */
  playBubblePopIn() {
    if (!this.enabled) return;
    console.log('[Sound] 🎵 Bubble pop-in');
    // TODO: Play bubble-pop-in.wav
    // Example: this.sounds.bubblePopIn.play();
  }

  /**
   * Play the bubble pop-out sound effect
   */
  playBubblePopOut() {
    if (!this.enabled) return;
    console.log('[Sound] 🎵 Bubble pop-out');
    // TODO: Play bubble-pop-out.wav
    // Example: this.sounds.bubblePopOut.play();
  }

  /**
   * Play a character-specific voice sound
   * @param {string} playerId - ID of the AI player
   */
  playAIVoice(playerId) {
    if (!this.enabled) return;
    console.log(`[Sound] 🎵 AI voice for player: ${playerId}`);
    // TODO: Map playerId to specific voice sound
    // Example: this.sounds.aiVoice1.play();
  }

  /**
   * Play a generic notification sound
   */
  playNotification() {
    if (!this.enabled) return;
    console.log('[Sound] 🎵 Notification');
    // TODO: Play notification.wav
  }

  /**
   * Stop all currently playing sounds
   */
  stopAll() {
    console.log('[Sound] ⏹️  Stopping all sounds');
    // TODO: Stop all audio elements
  }

  /**
   * Preload all sound files
   * @returns {Promise<void>}
   */
  async preload() {
    console.log('[Sound] 📥 Preloading sound files (stubbed)');
    // TODO: Load all .wav files
    // Example:
    // this.sounds.bubblePopIn = new Audio('/sounds/bubble-pop-in.wav');
    // this.sounds.bubblePopOut = new Audio('/sounds/bubble-pop-out.wav');
    // await Promise.all([
    //   this.sounds.bubblePopIn.load(),
    //   this.sounds.bubblePopOut.load()
    // ]);
    return Promise.resolve();
  }
}

// Export singleton instance
export const soundEffects = new SoundEffectsService();

// Export class for testing
export { SoundEffectsService };
