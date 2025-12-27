/**
 * Tutorial Messages System
 *
 * Provides educational commentary for AI players in tutorial mode.
 * AI explains their actions and reasoning to help new players understand the game.
 */

/**
 * Get a tutorial message for an AI action
 * @param {string} action - The action being taken ('BID', 'PASS', 'DISCARD', 'SWAP')
 * @param {Object} context - Context about the action
 * @returns {string} Tutorial message explaining the action
 */
export function getTutorialMessage(action, context) {
  switch (action) {
    case 'BID':
      return getBidTutorialMessage(context);
    case 'PASS':
      return getPassTutorialMessage(context);
    case 'DISCARD':
      return getDiscardTutorialMessage(context);
    case 'SWAP':
      return getSwapTutorialMessage(context);
    case 'START':
      return getGameStartTutorialMessage(context);
    default:
      return `I'm making a move...`;
  }
}

/**
 * Tutorial messages for bidding
 */
function getBidTutorialMessage(context) {
  const { bidAmount, cardName, cardType, reasoning } = context;

  const messages = [
    `I'm bidding $${bidAmount} to try to win ${cardName}. ${reasoning}`,
    `Bidding $${bidAmount} for this ${cardType} card. ${reasoning}`,
    `I'll bid $${bidAmount} because ${reasoning}`
  ];

  // Add card type-specific reasoning
  if (cardType === 'luxury') {
    return `I'm bidding $${bidAmount} for ${cardName}. Luxury cards give points, so I want to collect them!`;
  } else if (cardType === 'prestige') {
    return `Bidding $${bidAmount} for ${cardName}. Prestige cards reduce my final score, which is good in Low Society!`;
  } else if (cardType === 'disgrace') {
    return `This is a REVERSE auction for ${cardName}. The highest bidder has to take this card, which adds ${Math.abs(context.cardValue)} points. I'll bid low to avoid it!`;
  } else if (cardType === 'special') {
    return `Bidding $${bidAmount} for ${cardName}. Special cards can help me strategically!`;
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Tutorial messages for passing
 */
function getPassTutorialMessage(context) {
  const { reasoning, cardType } = context;

  if (cardType === 'disgrace') {
    return `I'm passing on this disgrace card. In a reverse auction, passing means I won't take the card. ${reasoning}`;
  }

  const messages = [
    `I'm passing because ${reasoning}`,
    `Passing on this one. ${reasoning}`,
    `I'll sit this auction out. ${reasoning}`
  ];

  // Common passing reasons for tutorial
  if (reasoning.includes('money')) {
    return `I'm passing because I need to save my money for later auctions. It's important to manage your cash!`;
  } else if (reasoning.includes('low')) {
    return `I'm passing because my remaining money is too low to compete. Bidding too much too early is risky!`;
  } else if (reasoning.includes('valuable')) {
    return `I'm passing to save my high-value bills for more important cards later.`;
  }

  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Tutorial messages for discarding luxury cards (Repo Man)
 */
function getDiscardTutorialMessage(context) {
  const { cardName, reasoning } = context;

  if (cardName) {
    return `I'm discarding ${cardName} to avoid the Repo Man penalty. The Repo Man makes the player with the most luxuries discard one!`;
  }

  return `I need to discard a luxury card because of the Repo Man. ${reasoning || 'It\'s the only way to avoid the penalty!'}`;
}

/**
 * Tutorial messages for card swapping (Pawn Shop Trade)
 */
function getSwapTutorialMessage(context) {
  const { reasoning, skipping } = context;

  if (skipping) {
    return `I'm skipping the Pawn Shop Trade. ${reasoning || 'I don\'t want to swap any cards right now.'}`;
  }

  return `I'm using the Pawn Shop Trade to swap cards. ${reasoning || 'This can help me adjust my strategy!'}`;
}

/**
 * Tutorial messages for game start
 */
function getGameStartTutorialMessage(context) {
  return `The game is starting! Remember: in Low Society, the LOWEST score wins. Avoid luxury cards and collect prestige cards!`;
}

/**
 * Get general strategy tips for tutorial mode
 * @param {string} phase - Current game phase
 * @param {Object} context - Game context
 * @returns {string|null} Strategy tip or null
 */
export function getStrategyTip(phase, context) {
  const tips = {
    STARTING: [
      "Watch how much money everyone has left. It affects who can bid!",
      "The first few cards set the tone for the game.",
      "Don't spend all your money too early!"
    ],
    AUCTION: [
      "In a STANDARD auction, the highest bidder wins the card.",
      "In a REVERSE auction, the highest bidder has to TAKE the card.",
      "Save your big bills for important moments!",
      "If everyone passes, the starting player takes the card for free.",
      "Watch what cards other players are collecting!"
    ],
    DISCARD_LUXURY: [
      "The Repo Man punishes the player with the MOST luxury cards.",
      "Sometimes it's better to avoid luxuries early on."
    ],
    CARD_SWAP: [
      "The Pawn Shop Trade lets the winner swap cards between ANY players!",
      "This can completely change the game strategy."
    ]
  };

  const phaseTips = tips[phase];
  if (!phaseTips || phaseTips.length === 0) return null;

  return phaseTips[Math.floor(Math.random() * phaseTips.length)];
}

/**
 * Generate reasoning for AI decisions in tutorial mode
 * @param {Object} aiPlayer - The AI player instance
 * @param {Object} gameState - Current game state
 * @param {string} decision - The decision being made
 * @returns {string} Reasoning explanation
 */
export function generateReasoning(aiPlayer, gameState, decision) {
  // Simple reasoning based on AI's current situation
  const moneyLeft = aiPlayer.getMoneyTotal();

  if (decision === 'bid') {
    if (moneyLeft > 20) {
      return "I have plenty of money left to spend";
    } else if (moneyLeft > 10) {
      return "I need to be careful with my remaining money";
    } else {
      return "I'm running low on money, but this card is worth it";
    }
  } else if (decision === 'pass') {
    if (moneyLeft < 5) {
      return "I don't have enough money to compete";
    } else {
      return "I want to save my money for better opportunities";
    }
  }

  return "this seems like the right move";
}
