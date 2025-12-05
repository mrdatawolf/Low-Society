# UI/UX Enhancement Checklist

Quick reference for implementing visual enhancements. See [UI-ENHANCEMENT-PLAN.md](UI-ENHANCEMENT-PLAN.md) for detailed specifications.

## Phase 1: Landing Page 🌟

### Background
- [ ] Add animated gradient background to HomeScreen
- [ ] Create subtle animation (moving gradient or shapes)
- [ ] Ensure responsive on all screen sizes
- [ ] Test performance (should be 60fps)

### Title & Branding
- [ ] Style "Low Society" title with themed font
- [ ] Add tagline "A White Trash Twist on High Society"
- [ ] Implement fade-in animation on load
- [ ] Add hover effects to title (optional)

### Entry Form
- [ ] Style player name input (rustic/themed look)
- [ ] Add placeholder text animation
- [ ] Style "Create Room" button with hover effects
- [ ] Style "Join Room" button with hover effects
- [ ] Add input validation visual feedback
- [ ] Test tab order and keyboard navigation

### Files to Create/Modify
- [ ] `client/src/styles/HomeScreen.css` (new)
- [ ] `client/src/components/HomeScreen.jsx` (enhance)
- [ ] Update `App.css` for global animation styles

---

## Phase 2: Poker Table View 🎰

### Table Layout
- [ ] Create `PokerTable.jsx` component
- [ ] Design oval/rectangular table with CSS
- [ ] Add felt texture or gradient background
- [ ] Make table responsive (desktop/tablet/mobile)
- [ ] Center table in viewport

### Player Seats
- [ ] Define 5 seat positions around table
  - [ ] Top-left seat
  - [ ] Top-right seat
  - [ ] Right seat
  - [ ] Left seat
  - [ ] Bottom seat (current player)
- [ ] Create `PlayerAvatar.jsx` component
- [ ] Position avatars at each seat
- [ ] Make positions responsive

### Avatar System
- [ ] Create circular avatar placeholder (colored circle)
- [ ] Display player initials in avatar
- [ ] Assign colors to players (10 color palette)
- [ ] Add name tag under each avatar
- [ ] Implement avatar join animation (pop in)
- [ ] Implement avatar leave animation (fade out)
- [ ] Add empty seat indicator

### Turn & Status Indicators
- [ ] Highlight active player (glowing border)
- [ ] Gray out passed players
- [ ] Add turn indicator arrow/icon
- [ ] Add "waiting" pulsing animation
- [ ] Test all states (active, passed, waiting, offline)

### Files to Create/Modify
- [ ] `client/src/components/PokerTable.jsx` (new)
- [ ] `client/src/components/PlayerAvatar.jsx` (new)
- [ ] `client/src/styles/PokerTable.css` (new)
- [ ] `client/src/components/GameScreen.jsx` (refactor)

---

## Phase 3: Card Animations 🃏

### Card Component
- [ ] Create `Card.jsx` component
- [ ] Design card front (name + value)
- [ ] Design card back (pattern/solid color)
- [ ] Make card responsive (scale on mobile)
- [ ] Add card hover effect (slight lift)

### Card Reveal Animation
- [ ] Start with face-down card at deck position
- [ ] Animate flip (rotateY)
- [ ] Animate scale up
- [ ] Animate move to center "current card" position
- [ ] Set duration to 0.5-1 second
- [ ] Add easing for smooth motion

### Card Collection Animation
- [ ] Animate card from center to winner's position
- [ ] Shrink card size during move
- [ ] Add to winner's card stack
- [ ] Highlight winner briefly
- [ ] Duration: 0.5 seconds

### Card Discard Animation (Repo Man)
- [ ] Highlight selected card on click
- [ ] Animate fade out
- [ ] Animate move to discard pile
- [ ] Remove from player's collection
- [ ] Test with multiple luxury cards

### Card Swap Animation (Pawn Shop Trade)
- [ ] Highlight two selected cards
- [ ] Lift cards up slightly
- [ ] Animate arc motion between players
- [ ] Land cards at new positions
- [ ] Duration: 1-1.5 seconds
- [ ] Test with different player positions

### Money/Bid Animation
- [ ] Create `BidPile.jsx` component
- [ ] Animate food stamps flying to center
- [ ] Stack bills in pot area
- [ ] Animate bills disappearing when lost
- [ ] Test with different bid amounts

### Files to Create/Modify
- [ ] `client/src/components/Card.jsx` (new)
- [ ] `client/src/components/CardDeck.jsx` (new)
- [ ] `client/src/components/BidPile.jsx` (new)
- [ ] `client/src/styles/CardAnimations.css` (new)
- [ ] Update `GameScreen.jsx` to use new components

---

## Phase 4: Game State Transitions 🎬

### Phase Overlays
- [ ] Create `PhaseOverlay.jsx` component
- [ ] "Game Starting..." overlay with countdown
- [ ] "Round X" banner slide-in/out
- [ ] "Bidding to Win/Avoid" indicator
- [ ] "Pawn Shop Trade" full-screen overlay
- [ ] "Repo Man" full-screen overlay
- [ ] Fade in/out transitions

### Turn Indicators
- [ ] Create `TurnIndicator.jsx` component
- [ ] Glowing border for active player
- [ ] Arrow pointing to active player
- [ ] Optional: Turn timer countdown
- [ ] Pulsing animation while waiting
- [ ] Test visibility on all backgrounds

### Results Screen
- [ ] Animate score count-up from 0
- [ ] Slide in leaderboard
- [ ] Highlight winner with special effect
- [ ] Show eliminated player differently
- [ ] Add celebration animation (optional confetti)
- [ ] Smooth transitions to "New Game" button

### Files to Create/Modify
- [ ] `client/src/components/PhaseOverlay.jsx` (new)
- [ ] `client/src/components/TurnIndicator.jsx` (new)
- [ ] `client/src/styles/Transitions.css` (new)
- [ ] `client/src/components/GameOverScreen.jsx` (enhance)

---

## Testing Checklist ✅

### Visual Testing
- [ ] Test all animations at 60fps
- [ ] Test on desktop (1920x1080, 1366x768)
- [ ] Test on tablet (iPad, Surface)
- [ ] Test on mobile (iPhone, Android)
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

### Animation Testing
- [ ] Card reveal animation smooth
- [ ] Card collection doesn't jitter
- [ ] Card swap arcs look natural
- [ ] Multiple cards animate without lag
- [ ] Phase transitions don't block gameplay
- [ ] Turn indicators clearly visible
- [ ] Avatar animations don't overlap

### Accessibility
- [ ] Test with `prefers-reduced-motion`
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements
- [ ] Ensure sufficient color contrast
- [ ] Test with animations disabled

### Performance
- [ ] Check bundle size (keep animations under 100KB)
- [ ] Profile with React DevTools
- [ ] Check memory usage during long games
- [ ] Verify 60fps during heavy animation sequences
- [ ] Test with 5 players + full card deck

---

## Dependencies to Add (If Needed)

### Optional Libraries
- [ ] Framer Motion: `npm install framer-motion` (~50KB)
- [ ] React Spring: `npm install react-spring` (~30KB)
- [ ] Anime.js: `npm install animejs` (~18KB)

**Recommendation**: Start with pure CSS, add library only if needed for complex animations.

---

## File Organization

### New Directory Structure
```
client/src/
├── components/
│   ├── ui/           (new folder for UI components)
│   │   ├── Card.jsx
│   │   ├── CardDeck.jsx
│   │   ├── BidPile.jsx
│   │   ├── PokerTable.jsx
│   │   ├── PlayerAvatar.jsx
│   │   ├── PhaseOverlay.jsx
│   │   └── TurnIndicator.jsx
│   └── screens/      (existing game screens)
│       ├── HomeScreen.jsx
│       ├── LobbyScreen.jsx
│       ├── GameScreen.jsx
│       └── GameOverScreen.jsx
├── styles/
│   ├── global/
│   │   ├── animations.css
│   │   └── variables.css
│   └── components/
│       ├── HomeScreen.css
│       ├── PokerTable.css
│       ├── CardAnimations.css
│       └── Transitions.css
└── assets/
    └── placeholders/
        ├── table-bg.svg
        └── card-back.svg
```

---

## Quick Start Commands

### Create New Component
```bash
# From client directory
touch src/components/ui/ComponentName.jsx
touch src/styles/components/ComponentName.css
```

### Test Animation
```bash
cd client
npm run dev
# Open http://localhost:3004
```

### Build for Production
```bash
cd client
npm run build
# Check dist/assets for bundle sizes
```

---

## Progress Tracking

**Current Phase**: Planning
**Started**: December 4, 2025
**Target Completion**: TBD

### Phase Status
- [ ] Phase 1: Landing Page (0%)
- [ ] Phase 2: Poker Table (0%)
- [ ] Phase 3: Card Animations (0%)
- [ ] Phase 4: Polish (0%)

Update this checklist as you complete items! ✨
