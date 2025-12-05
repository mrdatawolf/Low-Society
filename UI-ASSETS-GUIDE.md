# UI Assets Guide - Low Society

## Philosophy: Placeholder First, Replace Later

This document explains how the UI is structured for easy asset replacement. All current visuals are **CSS-based placeholders** designed to be swapped out with custom graphics later.

---

## Design Principles

### 1. **Separation of Concerns**
- **Structure (Components)**: Game logic and layout in `.jsx` files
- **Styling (CSS)**: Visual appearance in `.css` files
- **Assets (Future)**: Images, sprites, fonts in `/assets` folder

### 2. **Modular & Replaceable**
- All placeholder visuals use CSS (gradients, shapes, colors)
- Easy to swap with real images without touching component logic
- Asset paths centralized for quick replacement

### 3. **CSS Variables for Theming**
- All colors defined as CSS variables in `:root`
- Change theme by updating variables, not hunting through files

---

## Current Placeholder Strategy

### What We're Using Now

**Backgrounds:**
- CSS gradients instead of images
- Animated with `background-position` and keyframes
- Easy to replace with: `background-image: url('/assets/backgrounds/landing.jpg')`

**Cards:**
- Colored rectangles with text
- CSS borders and shadows for depth
- Easy to replace with: Card sprite sheets or individual images

**Avatars:**
- ✅ **IMPLEMENTED**: Low Society themed SVG icons (10 unique designs)
- Includes: Beer Can, Trailer, Food Stamp, Cigarette Pack, Bowling Pin, TV Dinner, Lawn Chair, Lottery Ticket, Pickup Truck, Six Pack
- Random assignment per player based on player ID (consistent across sessions)
- Colored circle backgrounds with themed icons
- Easy to replace with: Custom avatar images or user uploads

**Money/Food Stamps:**
- Green rectangles with $ text
- CSS styling only
- Easy to replace with: Food stamp images/sprites

**Table:**
- CSS gradient oval/rectangle
- Border-radius and box-shadow
- Easy to replace with: Poker table image (top-down view)

---

## Folder Structure (Current & Planned)

```
client/src/
├── components/           # React components (logic only)
│   ├── HomeScreen.jsx
│   ├── GameScreen.jsx
│   └── ui/              # Reusable UI components
│       ├── Card.jsx     # ✅ COMPLETED
│       ├── PlayerAvatar.jsx   # ✅ COMPLETED (Phase 2)
│       ├── AvatarIcons.jsx    # ✅ COMPLETED (Phase 2)
│       └── PokerTable.jsx     # ✅ COMPLETED (Phase 2)
├── styles/              # CSS styling (placeholder visuals)
│   ├── App.css          # Global styles & CSS variables
│   ├── HomeScreen.css   # Landing page animations
│   ├── PokerTable.css   # ✅ COMPLETED (Phase 2)
│   ├── PlayerAvatar.css # ✅ COMPLETED (Phase 2)
│   ├── Card.css         # ✅ COMPLETED (Phase 3)
│   └── CardAnimations.css # (future enhancements)
└── assets/              # Real assets (FUTURE - not created yet)
    ├── backgrounds/
    │   ├── landing.jpg
    │   └── table-felt.jpg
    ├── cards/
    │   ├── luxury/
    │   │   ├── pbr-6pack.png
    │   │   └── ...
    │   ├── prestige/
    │   └── disgrace/
    ├── avatars/
    │   └── default-set/
    ├── money/
    │   └── food-stamps/
    └── ui/
        ├── buttons/
        └── icons/
```

---

## How to Replace Assets Later

### Option 1: User-Provided Assets
Users can drop their own images into `/client/src/assets/` and update CSS:

```css
/* Before (Placeholder) */
.home-screen::before {
  background: linear-gradient(...);
}

/* After (Real Asset) */
.home-screen::before {
  background: url('/assets/backgrounds/trailer-park.jpg') center/cover;
}
```

### Option 2: Asset Pack System
Create themed asset packs that users can select:

```
assets/
├── themes/
│   ├── classic/         # Original Low Society theme
│   ├── dark-mode/       # Alternative theme
│   └── user-custom/     # User uploads
```

Component loads theme from config:
```jsx
const theme = useTheme(); // 'classic', 'dark-mode', or 'user-custom'
<div className={`card ${theme}`}>
```

---

## Modularity Checklist

### ✅ Phase 1: Landing Page (COMPLETED)
- [x] Background: CSS gradient (easily replaced with image)
- [x] Animations: Keyframes in separate CSS file
- [x] Colors: CSS variables in `:root`
- [x] Layout: Component structure independent of visuals

### ✅ Phase 2: Poker Table (COMPLETED)
- [x] Table: CSS gradient oval with center area for cards
- [x] Seats: Positioned divs that work with any avatar style (3-5 players)
- [x] Avatars: **Low Society themed SVG icons** (10 unique designs)
- [x] Created `PlayerAvatar.jsx` component with full feature set:
  - `avatarUrl` prop (optional, uses themed icons as default)
  - `playerName` prop (for display)
  - `playerId` prop (for consistent random avatar selection)
  - `color` prop (auto-generated background colors)
  - Status indicators (active, passed, turn)
  - Join/leave animations
  - Stats display (money, cards, bid)

**Implemented Avatar Icons (AvatarIcons.jsx):**
- 🍺 Beer Can - Golden beverage can with PBR label
- 🏠 Trailer - Classic mobile home with wheels
- 💵 Food Stamp - Green government assistance card
- 🚬 Cigarette Pack - Classic cigarette packaging
- 🎳 Bowling Pin - White pin with red stripes
- 📺 TV Dinner - Aluminum tray with compartments
- 🪑 Lawn Chair - Colorful striped folding chair
- 🎟️ Lottery Ticket - Gold scratch-off ticket
- 🚚 Pickup Truck - Rusty old pickup with bed
- 📦 Six Pack - Cardboard carrier with beer cans

**Random Assignment System:**
- Each player gets a themed icon based on their player ID hash
- Consistent assignment (same player ID = same avatar)
- 10 unique avatars ensure variety in multiplayer games

### 🔜 Phase 3: Card Animations (FUTURE)
- [ ] Cards: Create `Card.jsx` component that accepts:
  - `cardData` prop (name, value, type, description)
  - `frontImage` prop (optional, defaults to styled div)
  - `backImage` prop (optional, defaults to pattern)

**Example Card Component:**
```jsx
function Card({ cardData, frontImage, backImage, isFaceUp }) {
  return (
    <div className={`card ${isFaceUp ? 'face-up' : 'face-down'}`}>
      {isFaceUp ? (
        frontImage ?
          <img src={frontImage} alt={cardData.name} /> :
          <div className="card-placeholder">
            <span className="card-name">{cardData.name}</span>
            <span className="card-value">{cardData.value}</span>
          </div>
      ) : (
        backImage ?
          <img src={backImage} alt="Card back" /> :
          <div className="card-back-placeholder" />
      )}
    </div>
  );
}
```

---

## CSS Variables for Easy Theming

Located in `client/src/styles/App.css`:

```css
:root {
  /* Colors - Change these to retheme entire app */
  --bg-primary: #2a2a2a;
  --bg-secondary: #1a1a1a;
  --bg-card: #3a3a3a;
  --text-primary: #f0f0f0;
  --text-secondary: #b0b0b0;
  --accent-primary: #d4af37;     /* Gold/mustard */
  --accent-secondary: #8b4513;   /* Rusty brown */
  --border-color: #4a4a4a;
  --money-color: #4a7c4e;        /* Food stamp green */
  --danger-color: #c41e3a;
  --success-color: #228b22;

  /* Sizes (future) */
  --card-width: 120px;
  --card-height: 168px;
  --avatar-size: 80px;

  /* Animation timing (future) */
  --anim-fast: 0.2s;
  --anim-normal: 0.5s;
  --anim-slow: 1s;
}
```

To create a new theme, just override these variables:
```css
[data-theme="neon"] {
  --accent-primary: #ff00ff;
  --accent-secondary: #00ffff;
  /* ... etc */
}
```

---

## Asset Replacement Workflow

### Step 1: Create Assets
Design or commission:
- Background images (1920x1080 recommended)
- Card designs (consistent size, e.g., 300x420px)
- Avatar images (square, e.g., 200x200px)
- UI elements (buttons, icons)

### Step 2: Add to Project
```bash
# Create assets directory
mkdir -p client/src/assets/{backgrounds,cards,avatars,money,ui}

# Add your files
cp your-background.jpg client/src/assets/backgrounds/
cp your-cards/* client/src/assets/cards/
```

### Step 3: Update CSS
Find the placeholder style and replace with image:

```css
/* Find this */
.home-screen::before {
  background: linear-gradient(...);
}

/* Replace with this */
.home-screen::before {
  background: url('/assets/backgrounds/your-background.jpg') center/cover no-repeat;
}
```

### Step 4: Update Components (if needed)
If using component props for images:

```jsx
// Before
<Card cardData={data} />

// After
<Card
  cardData={data}
  frontImage={`/assets/cards/${data.type}/${data.id}.png`}
  backImage="/assets/cards/card-back.png"
/>
```

---

## Testing with Mock Assets

To test asset replacement without final graphics:

1. **Use placeholder services:**
   - https://via.placeholder.com/300x420/d4af37/000?text=Luxury+Card
   - https://picsum.photos/200/200 (random images)

2. **Create simple test assets:**
   - Use GIMP/Photoshop to create basic rectangles with text
   - Export as PNG with transparency
   - Test the replacement workflow

3. **Verify animations still work:**
   - Ensure images animate smoothly
   - Check load times don't impact gameplay
   - Test on different screen sizes

---

## Asset Requirements (When You're Ready)

### Backgrounds
- **Format**: JPG or PNG
- **Size**: 1920x1080 (or larger)
- **Optimization**: Compress to <500KB
- **Fallback**: Solid color or gradient

### Cards
- **Format**: PNG with transparency preferred
- **Size**: 300x420px (2.5:3.5 ratio) or SVG
- **Count**: 17 unique cards + 1 card back
- **Optimization**: Sprite sheet or individual files

### Avatars
- **Format**: PNG or SVG
- **Size**: 200x200px (square)
- **Count**: 10-20 default options
- **Fallback**: Colored circles with initials

### Money/Food Stamps
- **Format**: PNG or SVG
- **Size**: 120x60px (2:1 ratio)
- **Count**: 12 denominations ($1, $2, $3, $4, $5, $6, $8, $10, $12, $15, $20, $25)
- **Optimization**: Can use single template with text overlay

---

## Performance Considerations

### Image Optimization
- Use WebP format for smaller file sizes (with JPG/PNG fallback)
- Implement lazy loading for non-critical images
- Use sprite sheets for multiple small images (cards, icons)

### Loading Strategy
```jsx
// Preload critical assets
useEffect(() => {
  const criticalAssets = [
    '/assets/backgrounds/landing.jpg',
    '/assets/cards/card-back.png'
  ];
  criticalAssets.forEach(src => {
    const img = new Image();
    img.src = src;
  });
}, []);
```

### Fallback System
```css
/* Always provide fallbacks */
.card-front {
  background: linear-gradient(135deg, #fff, #f0f0f0); /* Fallback */
  background-image: var(--card-image, none); /* Real image */
}
```

---

## Future: Asset Manager Component

Consider building an asset manager for users:

```jsx
function AssetManager() {
  return (
    <div className="asset-manager">
      <h2>Customize Your Game</h2>

      <section>
        <h3>Background</h3>
        <input type="file" accept="image/*" onChange={handleBgUpload} />
        <button onClick={resetToDefault}>Reset to Default</button>
      </section>

      <section>
        <h3>Card Theme</h3>
        <select onChange={handleCardThemeChange}>
          <option value="default">Low Society (Default)</option>
          <option value="high-society">High Society</option>
          <option value="custom">Custom (Upload)</option>
        </select>
      </section>

      {/* ... more customization options */}
    </div>
  );
}
```

---

## Summary

✅ **Current State**: All visuals are CSS placeholders
✅ **Modular Design**: Components separate from styling
✅ **Easy Replacement**: Drop-in images without changing logic
✅ **CSS Variables**: Quick theming changes
✅ **Future Ready**: File structure supports asset packs

**Key Takeaway**: You can play the full game with placeholders NOW, and add gorgeous graphics LATER without touching any game logic!

---

**Last Updated**: December 5, 2025
**Status**: Phase 1 & 2 complete with themed placeholder graphics
**Completed Phases**:
- ✅ Phase 1: Landing Page Enhancement (animated backgrounds, entrance animations)
- ✅ Phase 2: Poker Table & Avatar System (themed SVG icons, positioned players, status indicators)
**Next Phase**: Phase 3 - Card Animations (card reveal, collection, swap, discard)
