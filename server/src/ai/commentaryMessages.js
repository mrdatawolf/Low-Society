/**
 * Commentary Messages System
 *
 * Provides entertaining AI-to-AI conversations for in-game commentary mode.
 * Includes stories, jokes, emotional reactions, and player action commentary.
 */

/**
 * Commentary message library organized by event type
 */
const COMMENTARY_LIBRARY = {
  HIGH_BID: [
    "Whoa, {playerName} is going all-in!",
    "That's a bold bid, {playerName}!",
    "Someone's feeling confident...",
    "Big spender alert!",
    "Throwing money around like it grows on trees!",
    "Easy there, {playerName}, save some for the rest of us!"
  ],

  LOW_BID: [
    "Playing it safe, I see",
    "That's a conservative bid",
    "Not feeling too confident about this one?",
    "Keeping those food stamps close, eh?"
  ],

  PLAYER_PASSED: [
    "Smart move passing there",
    "Sometimes the best move is no move",
    "Saving money for later, huh?",
    "{playerName} is sitting this one out",
    "Wise choice, {playerName}",
    "I'd pass too if I were you!"
  ],

  CARD_WON_LUXURY: [
    "Nice win, {playerName}!",
    "Congratulations on your new {cardName}!",
    "Another luxury for the collection!",
    "Living the high life now!",
    "That's going to look great in your collection... and hurt your score!"
  ],

  CARD_WON_DISGRACE: [
    "Ouch, that's gotta hurt!",
    "Sorry {playerName}, you got stuck with {cardName}!",
    "Well, at least it's... unique?",
    "That's going to cost you points!",
    "Ha! You got the {cardName}!"
  ],

  CARD_WON_PRESTIGE: [
    "Good grab, {playerName}!",
    "That'll help your score!",
    "Smart move getting {cardName}",
    "Now THAT'S how you play Low Society!"
  ],

  GAME_START: [
    "Alright, let's see who can stay the most low-class!",
    "Remember folks, we're aiming for the bottom!",
    "Time to see who's the worst... I mean best!",
    "Let the reverse snobbery begin!",
    "May the lowest score win!"
  ],

  ROUND_RESET: [
    "Here we go again!",
    "Round two, fight!",
    "Let's try this again...",
    "Another chance to mess up!",
    "Back to square one!"
  ],

  GAME_END: [
    "What a game!",
    "That was intense!",
    "Well played everyone!",
    "Time to see who's the biggest loser... literally!",
    "And that's a wrap!"
  ]
};

/**
 * Story library - longer narratives AI can tell
 */
const STORIES = [
  "This reminds me of the time I had to pawn my lucky horseshoe. Still miss that thing...",
  "My cousin once won a poker game with nothing but Food Stamps. True story!",
  "You know, I used to have a Tanning Bed. Worst investment of my life!",
  "I once knew a guy who collected Bowling Trophies. He had like 47 of them. Never bowled a day in his life!",
  "Back in my day, we didn't have fancy card games. We just threw rocks at cans!",
  "Fun fact: I actually invented the Pawn Shop Trade. Okay, not really, but I wish I did!",
  "My grandma always said 'it's not about what you have, it's about what you avoid.' She was talking about relatives, but it applies here too!",
  "I saw a Velvet Painting at a yard sale once. Paid $50 for it. Turns out it was worth... $2. Classic me!"
];

/**
 * Joke library - humorous one-liners
 */
const JOKES = [
  "At least we're not playing Monopoly - that game ruins friendships!",
  "I'd rather have a Tanning Bed than a mansion anyway. More practical!",
  "Why did the Food Stamp cross the road? To get to the discount bin!",
  "You know what they say: one person's trash is another person's... still trash!",
  "I'm not saying I'm bad with money, but I once bid $15 on a Bowling Trophy",
  "Low Society: where being poor is actually the goal!",
  "This game is like my bank account - I'm trying to keep it as low as possible!"
];

/**
 * Emotional reaction library
 */
const REACTIONS = {
  EXCITED: [
    "Oh this is getting good!",
    "Now we're talking!",
    "This is my chance!",
    "Finally, something interesting!",
    "Yes! This is what I've been waiting for!"
  ],

  FRUSTRATED: [
    "Ugh, I really needed that card...",
    "Are you kidding me?!",
    "Of all the luck...",
    "Why does this always happen to me?",
    "Come on!"
  ],

  SURPRISED: [
    "Wait, what?!",
    "Did not see that coming!",
    "Well, that's unexpected!",
    "Seriously?!",
    "No way!"
  ],

  AMUSED: [
    "Ha! Classic!",
    "This is hilarious!",
    "You can't make this stuff up!",
    "That's comedy gold!",
    "Best game ever!"
  ],

  NERVOUS: [
    "This is making me nervous...",
    "I have a bad feeling about this",
    "Please don't let it be me...",
    "Fingers crossed!",
    "Here goes nothing..."
  ]
};

/**
 * Get a commentary message for a specific event
 * @param {string} event - The event type
 * @param {Object} context - Context about the event (playerName, cardName, etc.)
 * @returns {string} Commentary message
 */
export function getCommentaryMessage(event, context = {}) {
  const messages = COMMENTARY_LIBRARY[event];
  if (!messages || messages.length === 0) {
    return null;
  }

  const randomMessage = selectRandom(messages);
  return interpolate(randomMessage, context);
}

/**
 * Get a random story
 * @returns {string} A story
 */
export function getStory() {
  return selectRandom(STORIES);
}

/**
 * Get a random joke
 * @returns {string} A joke
 */
export function getJoke() {
  return selectRandom(JOKES);
}

/**
 * Get an emotional reaction
 * @param {string} emotion - The emotion type (EXCITED, FRUSTRATED, etc.)
 * @returns {string} Reaction message
 */
export function getReaction(emotion) {
  const reactions = REACTIONS[emotion];
  if (!reactions) {
    return "...";
  }
  return selectRandom(reactions);
}

/**
 * Generate a conversational response to another AI's message
 * @param {string} previousMessage - The message to respond to
 * @param {Object} context - Context about the game
 * @returns {string|null} Response message or null
 */
export function generateResponse(previousMessage, context) {
  // Simple response generation based on keywords
  if (previousMessage.includes("all-in") || previousMessage.includes("bold")) {
    return selectRandom([
      "Sometimes you gotta take risks!",
      "Fortune favors the bold!",
      "Or the foolish... we'll see!",
      "That's the spirit!"
    ]);
  }

  if (previousMessage.includes("passing") || previousMessage.includes("sit this out")) {
    return selectRandom([
      "Probably smart",
      "Yeah, I might do the same",
      "Save that money!",
      "Can't win if you don't play... but can't lose either!"
    ]);
  }

  if (previousMessage.includes("hurt") || previousMessage.includes("ouch")) {
    return selectRandom([
      "Better you than me!",
      "Tough break!",
      "That's gonna sting!",
      "Ooof, yeah that's rough"
    ]);
  }

  // Random chance to not respond
  if (Math.random() < 0.5) {
    return null;
  }

  return selectRandom([
    "Ha!",
    "True that",
    "For sure",
    "You said it!",
    "Ain't that the truth",
    "Totally",
    "Yup"
  ]);
}

/**
 * Determine what type of message an AI should say
 * Balances between event commentary, stories, jokes, and reactions
 * @param {string} currentPhase - Current game phase
 * @param {Object} recentEvents - Recent game events
 * @returns {Object} Message type and data
 */
export function determineMessageType(currentPhase, recentEvents = {}) {
  const rand = Math.random();

  // 60% chance of event commentary
  if (rand < 0.6 && recentEvents.lastEvent) {
    return {
      type: 'EVENT_COMMENTARY',
      event: recentEvents.lastEvent,
      context: recentEvents.context
    };
  }

  // 20% chance of story
  if (rand < 0.8) {
    return {
      type: 'STORY'
    };
  }

  // 10% chance of joke
  if (rand < 0.9) {
    return {
      type: 'JOKE'
    };
  }

  // 10% chance of reaction
  return {
    type: 'REACTION',
    emotion: selectRandom(['EXCITED', 'AMUSED', 'SURPRISED'])
  };
}

/**
 * Select a random item from an array
 * @param {Array} array - Array to select from
 * @returns {*} Random item
 */
function selectRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Interpolate variables in a message template
 * @param {string} template - Message template with {variable} placeholders
 * @param {Object} context - Values to interpolate
 * @returns {string} Interpolated message
 */
function interpolate(template, context) {
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return context[key] !== undefined ? context[key] : match;
  });
}

export { COMMENTARY_LIBRARY, STORIES, JOKES, REACTIONS };
