/**
 * Interactive Story System for Eliminated AI Players
 * Stories unfold over multiple rounds with responses from other eliminated players
 */

// Multi-part stories that unfold over time
const STORIES = [
  {
    id: 'fishing_trip',
    parts: [
      "So there I was, down at the creek with nothing but a stick and some old string...",
      "Well, I tied that string to the stick and found myself the fattest worm you ever did see.",
      "Cast that line out and wouldn't you know it - something BIG took the bait!",
      "I'm pulling and pulling, nearly fell in twice, and finally got it to shore...",
      "Turned out to be an old boot. But inside that boot? A twenty dollar bill!",
      "Used that twenty to buy a real fishing rod. Never caught nothing with it though."
    ]
  },
  {
    id: 'garage_sale',
    parts: [
      "Y'all remember that garage sale on Maple Street last summer?",
      "I got there early, 6 AM sharp, looking for deals.",
      "Found this old painting in a box marked 'Free' - some lady with a weird smile.",
      "Took it home, hung it in my living room. My wife HATED it.",
      "Neighbor came over, said it looked just like a famous painting. Took it to get appraised.",
      "Appraiser laughed so hard he cried. Turns out it was a paint-by-numbers kit from 1987. Still got it though!"
    ]
  },
  {
    id: 'cooking_disaster',
    parts: [
      "Let me tell you about the time I tried to impress my in-laws with a fancy dinner...",
      "I watched three cooking shows and bought ingredients I couldn't even pronounce.",
      "Everything was going fine until I mistook the cayenne for paprika. Used the WHOLE jar.",
      "The smoke alarm went off twice. The dog ran away. The cat hid under the bed.",
      "My mother-in-law took one bite and her face turned redder than a tomato.",
      "We ended up ordering pizza. Best decision I made that whole day."
    ]
  },
  {
    id: 'car_trouble',
    parts: [
      "My old pickup truck broke down on Route 9 last winter, middle of nowhere.",
      "Popped the hood, looked at the engine like I knew what I was doing. Didn't have a clue.",
      "Flagged down this guy in a fancy car. He pulls over, gets out in a three-piece suit.",
      "Turns out he used to be a mechanic before becoming a lawyer. Who knew?",
      "Fixed my truck with a paper clip and some duct tape in about five minutes.",
      "Wouldn't take any money. Just said 'pass it on.' Still got that paper clip on my key chain."
    ]
  },
  {
    id: 'lottery_ticket',
    parts: [
      "Found a lottery ticket in my jacket pocket from six months ago.",
      "Checked the numbers online - I had FOUR out of six! Won 50 bucks!",
      "Went to cash it in, feeling pretty good about myself.",
      "Lady at the counter said it expired last week. Missed it by SEVEN DAYS.",
      "I was so mad I bought ten more tickets with my own money.",
      "Didn't win a single thing. That's how they get you!"
    ]
  }
];

// Reactions/responses from audience members
const STORY_REACTIONS = [
  "No way! What happened next?",
  "I can't believe that!",
  "That reminds me of the time when...",
  "You're pulling my leg!",
  "Classic {storyteller}!",
  "Tell me you're joking!",
  "I've heard this one before, but it never gets old!",
  "This is better than TV!",
  "Wait, wait, slow down!",
  "Then what?!",
  "You always got the best stories, {storyteller}.",
  "I'm on the edge of my seat here!",
  "Ain't that something!",
  "Lord have mercy!",
  "That's the funniest thing I heard all week!",
  "Keep going, I gotta hear how this ends!",
  "I knew this was gonna be good!",
  "My cousin did something like that once!",
  "No you didn't!",
  "Get outta here with that!"
];

/**
 * Story System Manager
 * Tracks ongoing stories and manages turn-taking between storyteller and audience
 */
export class StorySystem {
  constructor() {
    this.activeStory = null;
    this.storytellerId = null;
    this.currentPartIndex = 0;
    this.lastReactorId = null;
    this.storyQueue = [...STORIES]; // Copy of available stories
  }

  /**
   * Check if there should be an active story
   * Stories start when 2+ players are eliminated
   */
  shouldStartStory(eliminatedPlayers) {
    return !this.activeStory && eliminatedPlayers.length >= 2;
  }

  /**
   * Start a new story with a random eliminated player as storyteller
   */
  startStory(eliminatedPlayers) {
    if (eliminatedPlayers.length < 2) return false;

    // Pick random storyteller from eliminated players
    this.storytellerId = eliminatedPlayers[Math.floor(Math.random() * eliminatedPlayers.length)].id;

    // Pick random story from queue
    if (this.storyQueue.length === 0) {
      this.storyQueue = [...STORIES]; // Refresh queue
    }
    const storyIndex = Math.floor(Math.random() * this.storyQueue.length);
    this.activeStory = this.storyQueue.splice(storyIndex, 1)[0];

    this.currentPartIndex = 0;
    this.lastReactorId = null;

    console.log(`[Story] ${this.storytellerId} starting story: ${this.activeStory.id}`);
    return true;
  }

  /**
   * Check if the storyteller is eliminated (can continue story)
   */
  isStorytellerEliminated(activePlayers) {
    return !activePlayers.some(p => p.id === this.storytellerId);
  }

  /**
   * Get next story part from the storyteller
   */
  getNextStoryPart(storyteller) {
    if (!this.activeStory || this.currentPartIndex >= this.activeStory.parts.length) {
      return null;
    }

    const part = this.activeStory.parts[this.currentPartIndex];
    this.currentPartIndex++;

    // Check if story is complete
    if (this.currentPartIndex >= this.activeStory.parts.length) {
      console.log(`[Story] Story ${this.activeStory.id} completed!`);
      this.activeStory = null;
      this.storytellerId = null;
    }

    return part;
  }

  /**
   * Get a reaction from an eliminated player (not the storyteller)
   */
  getReaction(eliminatedPlayers, storytellerName) {
    // Filter out storyteller and last reactor
    const availableReactors = eliminatedPlayers.filter(p =>
      p.id !== this.storytellerId && p.id !== this.lastReactorId
    );

    if (availableReactors.length === 0) {
      // If only one other person, they can repeat
      const reactors = eliminatedPlayers.filter(p => p.id !== this.storytellerId);
      if (reactors.length === 0) return null;

      const reactor = reactors[Math.floor(Math.random() * reactors.length)];
      this.lastReactorId = reactor.id;
      return {
        reactor,
        message: this.formatReaction(storytellerName)
      };
    }

    // Pick random reactor
    const reactor = availableReactors[Math.floor(Math.random() * availableReactors.length)];
    this.lastReactorId = reactor.id;

    return {
      reactor,
      message: this.formatReaction(storytellerName)
    };
  }

  /**
   * Format a reaction message
   */
  formatReaction(storytellerName) {
    const template = STORY_REACTIONS[Math.floor(Math.random() * STORY_REACTIONS.length)];
    return template.replace('{storyteller}', storytellerName);
  }

  /**
   * Check if there's an active story
   */
  hasActiveStory() {
    return this.activeStory !== null;
  }

  /**
   * Reset the story system (for new games)
   */
  reset() {
    this.activeStory = null;
    this.storytellerId = null;
    this.currentPartIndex = 0;
    this.lastReactorId = null;
    this.storyQueue = [...STORIES];
  }
}
