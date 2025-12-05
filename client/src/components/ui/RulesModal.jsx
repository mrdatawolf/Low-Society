/**
 * RulesModal Component
 *
 * Full-screen modal displaying game rules and how to play
 */

import { useState } from 'react';
import '../../styles/RulesModal.css';

export function RulesModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  return (
    <div className="rules-modal-overlay" onClick={onClose}>
      <div className="rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="rules-close-btn" onClick={onClose}>×</button>

        <h1 className="rules-title">How to Play Low Society</h1>

        {/* Tab Navigation */}
        <div className="rules-tabs">
          <button
            className={`rules-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`rules-tab ${activeTab === 'gameplay' ? 'active' : ''}`}
            onClick={() => setActiveTab('gameplay')}
          >
            Gameplay
          </button>
          <button
            className={`rules-tab ${activeTab === 'cards' ? 'active' : ''}`}
            onClick={() => setActiveTab('cards')}
          >
            Card Types
          </button>
          <button
            className={`rules-tab ${activeTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategy')}
          >
            Strategy
          </button>
        </div>

        {/* Tab Content */}
        <div className="rules-content">
          {activeTab === 'overview' && (
            <div className="rules-section">
              <h2>Game Overview</h2>
              <p>
                Low Society is a reverse auction game where you bid to win (or avoid) various items
                that affect your social status. The goal is to have the LOWEST score at the end of the game.
              </p>

              <h3>Objective</h3>
              <p>
                End the game with the <strong>lowest total score</strong> among all players. However,
                there's a catch: <strong>the player with the least money remaining is eliminated</strong>
                from winning, even if they have the lowest score!
              </p>

              <h3>Key Concepts</h3>
              <ul>
                <li><strong>Lower is Better:</strong> Most items add points to your score - try to avoid them!</li>
                <li><strong>Money Management:</strong> Don't run out of money or you'll be eliminated</li>
                <li><strong>Reverse Auctions:</strong> Sometimes you bid to AVOID taking a card instead of winning it</li>
                <li><strong>Special Cards:</strong> Some cards have unique effects like swapping or discarding</li>
              </ul>

              <h3>Game Setup</h3>
              <ul>
                <li>3-5 players start with $40 in food stamps (money)</li>
                <li>15 cards are shuffled to create the item deck</li>
                <li>Each player randomly loses one money card at the start</li>
                <li>Cards are auctioned one at a time until the deck is empty</li>
              </ul>
            </div>
          )}

          {activeTab === 'gameplay' && (
            <div className="rules-section">
              <h2>How to Play</h2>

              <h3>Auction Phase</h3>
              <p>Each round, a new card is drawn and auctioned:</p>

              <h4>Standard Auctions (Bidding to Win)</h4>
              <ul>
                <li>Players bid money to WIN the card</li>
                <li>Higher bids beat lower bids</li>
                <li>The winner takes the card and loses their bid money</li>
                <li>Best for low-value luxury items or cards with positive effects</li>
              </ul>

              <h4>Reverse Auctions (Bidding to Avoid)</h4>
              <ul>
                <li>Triggered by high-value Disgrace cards</li>
                <li>Players bid money to AVOID taking the card</li>
                <li>The player who bids the LEAST (or passes first) is stuck with the card</li>
                <li>That player loses their bid money AND takes the card</li>
                <li>Use this to force bad cards onto opponents</li>
              </ul>

              <h3>Your Turn Options</h3>
              <ol>
                <li><strong>Bid:</strong> Select money cards totaling more than the current highest bid</li>
                <li><strong>Pass:</strong> Drop out of the current auction (can't bid again this round)</li>
              </ol>

              <h3>Special Card Effects</h3>
              <p>Some cards trigger special phases when won:</p>

              <h4>Pawn Shop Trade (Card Swap)</h4>
              <ul>
                <li>Winner selects any card from any player (including themselves)</li>
                <li>Then selects any card from any other player</li>
                <li>The two cards swap owners</li>
                <li>Great for ditching your worst card or stealing opponent's best</li>
              </ul>

              <h4>Repo Man (Discard Luxury)</h4>
              <ul>
                <li>Target player must discard their highest-value Luxury card</li>
                <li>The card is removed from the game</li>
                <li>Use this to eliminate low-scoring options from opponents</li>
              </ul>

              <h3>Game End</h3>
              <p>The game ends when all 15 cards have been auctioned. Then:</p>
              <ol>
                <li>Add up all card values for each player (their score)</li>
                <li>Eliminate the player with the LEAST money remaining</li>
                <li>The player with the LOWEST score (who wasn't eliminated) wins!</li>
              </ol>
            </div>
          )}

          {activeTab === 'cards' && (
            <div className="rules-section">
              <h2>Card Types</h2>

              <div className="card-type-section luxury">
                <h3>💚 Luxury Cards (Green)</h3>
                <p>
                  <strong>Value Range:</strong> 2-10 points<br/>
                  <strong>Auction Type:</strong> Standard (bid to win)<br/>
                  <strong>Strategy:</strong> Try to win the lowest values (2-4). Avoid the high values (8-10).
                </p>
                <p>
                  These represent "luxury" items that add points to your score. Lower values
                  are good to have, while higher values should be avoided or saved for reverse auctions.
                </p>
                <p><strong>Examples:</strong> Beer Can (2), Trailer (10), Bowling Trophy (8)</p>
              </div>

              <div className="card-type-section prestige">
                <h3>⭐ Prestige Cards (Gold)</h3>
                <p>
                  <strong>Value:</strong> Multiplier (×2, ×3, ×4)<br/>
                  <strong>Auction Type:</strong> Standard (bid to win)<br/>
                  <strong>Strategy:</strong> Only bid if you have low-value cards. These multiply your HIGHEST card!
                </p>
                <p>
                  These cards multiply the value of your single highest card. Can be devastating
                  if you have high-value Disgrace cards, but great if you only have low Luxury cards.
                </p>
                <p><strong>Examples:</strong> "Keeping Up Appearances" (×2), "Social Climber" (×3)</p>
              </div>

              <div className="card-type-section disgrace">
                <h3>❌ Disgrace Cards (Red)</h3>
                <p>
                  <strong>Value Range:</strong> 11-15 points<br/>
                  <strong>Auction Type:</strong> Reverse (bid to avoid!)<br/>
                  <strong>Strategy:</strong> Bid high to avoid these! They add massive points to your score.
                </p>
                <p>
                  These are the cards you DON'T want. When drawn, the auction reverses -
                  players bid to avoid taking the card. Lowest bidder gets stuck with it!
                </p>
                <p><strong>Examples:</strong> DUI Record (15), Eviction Notice (13), Jail Time (11)</p>
              </div>

              <div className="card-type-section special">
                <h3>🎴 Special Cards (Purple)</h3>
                <p>
                  <strong>Value:</strong> 0 points (but has an effect)<br/>
                  <strong>Auction Type:</strong> Standard (bid to win)<br/>
                  <strong>Strategy:</strong> Use these to manipulate the game state in your favor
                </p>

                <h4>Pawn Shop Trade (Card Swap)</h4>
                <p>
                  After winning, select any card from any player, then select any card from a
                  different player. Those two cards swap owners. Use this to:
                </p>
                <ul>
                  <li>Give away your worst card</li>
                  <li>Steal an opponent's best (lowest) card</li>
                  <li>Sabotage opponents by trading their good cards for bad ones</li>
                </ul>

                <h4>Repo Man (Force Discard)</h4>
                <p>
                  After winning, select any opponent. They must discard their highest-value
                  Luxury card (permanently removed from game). Use this to:
                </p>
                <ul>
                  <li>Eliminate low-scoring options from opponents</li>
                  <li>Remove cards that could be swapped to you later</li>
                  <li>Force opponents to keep only high-value cards</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'strategy' && (
            <div className="rules-section">
              <h2>Strategy Tips</h2>

              <h3>Money Management</h3>
              <ul>
                <li><strong>Don't Go Broke:</strong> Having the least money = automatic elimination, even with lowest score</li>
                <li><strong>Save for Reverse Auctions:</strong> Keep money to bid high when avoiding Disgrace cards</li>
                <li><strong>Force Opponents to Overspend:</strong> Drive up bids on low-value cards to drain their money</li>
                <li><strong>Track Everyone's Money:</strong> Know who's close to being broke</li>
              </ul>

              <h3>Card Collection</h3>
              <ul>
                <li><strong>Get Low Luxury Cards Early:</strong> Cards valued 2-4 are safe to collect</li>
                <li><strong>Avoid Prestige Unless Safe:</strong> Only take multipliers if your highest card is low</li>
                <li><strong>Never Take Disgrace Voluntarily:</strong> Always bid to avoid these in reverse auctions</li>
                <li><strong>Use Special Cards Wisely:</strong> Save swaps for maximum impact</li>
              </ul>

              <h3>Bidding Tactics</h3>
              <ul>
                <li><strong>Opening Bids:</strong> Start low to conserve money, but not too low in reverse auctions</li>
                <li><strong>Mind the Money Gap:</strong> Force the poorest player to take bad cards by outbidding them</li>
                <li><strong>Passing Strategy:</strong> Sometimes it's better to pass and save money than to win at high cost</li>
                <li><strong>Reading Opponents:</strong> Track who's desperate to avoid cards vs who wants them</li>
              </ul>

              <h3>Advanced Tactics</h3>
              <ul>
                <li><strong>Multiplier Baiting:</strong> Let opponents take multipliers, then swap high cards to them</li>
                <li><strong>Strategic Repo Man:</strong> Remove opponents' low cards so they can't improve their score</li>
                <li><strong>Sacrifice Play:</strong> Take a bad card if it forces someone else to go broke</li>
                <li><strong>Endgame Positioning:</strong> In final rounds, ensure you have more money than at least one player</li>
              </ul>

              <h3>Common Mistakes to Avoid</h3>
              <ul>
                <li>❌ Taking multipliers when you have high-value cards</li>
                <li>❌ Spending all your money early (can't bid in reverse auctions)</li>
                <li>❌ Ignoring opponents' money totals</li>
                <li>❌ Wasting special cards on low-impact plays</li>
                <li>❌ Passing too early in reverse auctions (might get stuck with the card)</li>
              </ul>

              <h3>Winning Formula</h3>
              <ol>
                <li>Collect only low-value Luxury cards (2-5 points)</li>
                <li>Avoid all Disgrace cards and high Luxury cards</li>
                <li>Don't take Prestige multipliers unless you're confident</li>
                <li>Use special cards to sabotage the leader or protect your position</li>
                <li>Keep more money than at least one opponent at all times</li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RulesButton({ onClick }) {
  return (
    <button className="rules-button" onClick={onClick} title="View Rules">
      <span className="rules-icon">?</span>
      <span className="rules-label">Rules</span>
    </button>
  );
}
