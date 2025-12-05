/**
 * AvatarIcons Component
 *
 * Low Society themed avatar icons using CSS/SVG
 * Each icon is a themed placeholder that can be randomly assigned
 */

// Beer Can Avatar
export function BeerCanAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="beerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#FFD700', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#FFA500', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#FF8C00', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Can body */}
      <rect x="30" y="20" width="40" height="60" rx="5" fill="url(#beerGradient)" />
      {/* Can top */}
      <ellipse cx="50" cy="20" rx="20" ry="5" fill="#C0C0C0" />
      {/* Can tab */}
      <ellipse cx="50" cy="20" rx="8" ry="3" fill="#888" />
      {/* Label */}
      <rect x="35" y="40" width="30" height="20" rx="3" fill="#8B0000" opacity="0.8" />
      <text x="50" y="52" fontSize="10" fill="#FFF" textAnchor="middle" fontWeight="bold">PBR</text>
    </svg>
  );
}

// Trailer Avatar
export function TrailerAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Trailer body */}
      <rect x="20" y="35" width="60" height="35" rx="3" fill="#E8E8E8" stroke="#666" strokeWidth="2" />
      {/* Roof */}
      <polygon points="18,35 82,35 75,25 25,25" fill="#8B4513" stroke="#5C3317" strokeWidth="2" />
      {/* Windows */}
      <rect x="28" y="42" width="15" height="12" fill="#87CEEB" stroke="#333" strokeWidth="1" />
      <rect x="57" y="42" width="15" height="12" fill="#87CEEB" stroke="#333" strokeWidth="1" />
      {/* Door */}
      <rect x="44" y="45" width="12" height="20" fill="#654321" stroke="#333" strokeWidth="1" />
      <circle cx="54" cy="55" r="1.5" fill="#FFD700" />
      {/* Wheels */}
      <circle cx="30" cy="72" r="6" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="70" cy="72" r="6" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="30" cy="72" r="3" fill="#888" />
      <circle cx="70" cy="72" r="3" fill="#888" />
    </svg>
  );
}

// Food Stamp Avatar
export function FoodStampAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Stamp background */}
      <rect x="15" y="30" width="70" height="40" rx="3" fill="#90EE90" stroke="#2F4F2F" strokeWidth="2" />
      {/* Stamp border pattern */}
      <rect x="18" y="33" width="64" height="34" rx="2" fill="none" stroke="#2F4F2F" strokeWidth="1" strokeDasharray="2,2" />
      {/* Dollar sign */}
      <text x="50" y="58" fontSize="32" fill="#2F4F2F" textAnchor="middle" fontWeight="bold">$</text>
      {/* Value */}
      <text x="50" y="68" fontSize="10" fill="#2F4F2F" textAnchor="middle" fontWeight="bold">FOOD</text>
    </svg>
  );
}

// Cigarette Pack Avatar
export function CigarettePackAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Pack body */}
      <rect x="30" y="20" width="40" height="60" rx="2" fill="#E8E8E8" stroke="#333" strokeWidth="2" />
      {/* Red top section */}
      <rect x="30" y="20" width="40" height="25" rx="2" fill="#DC143C" />
      {/* Brand area */}
      <ellipse cx="50" cy="32" rx="15" ry="8" fill="#FFD700" />
      <text x="50" y="36" fontSize="8" fill="#333" textAnchor="middle" fontWeight="bold">CIGS</text>
      {/* Warning label */}
      <rect x="32" y="50" width="36" height="12" fill="#FFF" />
      <text x="50" y="58" fontSize="6" fill="#333" textAnchor="middle">WARNING</text>
    </svg>
  );
}

// Bowling Pin Avatar
export function BowlingPinAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="pinGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#F5F5F5', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#FFF', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F5F5F5', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      {/* Pin body */}
      <ellipse cx="50" cy="25" rx="12" ry="10" fill="url(#pinGradient)" stroke="#333" strokeWidth="2" />
      <path d="M 38 30 Q 35 50 40 70 L 60 70 Q 65 50 62 30 Z" fill="url(#pinGradient)" stroke="#333" strokeWidth="2" />
      {/* Red stripes */}
      <ellipse cx="50" cy="45" rx="14" ry="3" fill="#DC143C" />
      <ellipse cx="50" cy="52" rx="14" ry="3" fill="#DC143C" />
      {/* Base */}
      <ellipse cx="50" cy="70" rx="10" ry="4" fill="#E8E8E8" stroke="#333" strokeWidth="2" />
    </svg>
  );
}

// TV Dinner Avatar
export function TVDinnerAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Tray */}
      <rect x="20" y="30" width="60" height="45" rx="3" fill="#333" stroke="#666" strokeWidth="2" />
      {/* Compartments */}
      <rect x="23" y="33" width="25" height="39" fill="#8B4513" />
      <rect x="51" y="33" width="26" height="18" fill="#90EE90" />
      <rect x="51" y="54" width="26" height="18" fill="#FFD700" />
      {/* Aluminum foil texture */}
      <rect x="20" y="30" width="60" height="45" rx="3" fill="none" stroke="#AAA" strokeWidth="1" opacity="0.3" strokeDasharray="3,3" />
      {/* Brand label */}
      <rect x="35" y="25" width="30" height="8" rx="2" fill="#DC143C" />
      <text x="50" y="30" fontSize="6" fill="#FFF" textAnchor="middle" fontWeight="bold">TV DINNER</text>
    </svg>
  );
}

// Lawn Chair Avatar
export function LawnChairAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Chair frame */}
      <line x1="25" y1="70" x2="35" y2="35" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="70" x2="65" y2="35" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="25" y1="70" x2="30" y2="75" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      <line x1="75" y1="70" x2="70" y2="75" stroke="#666" strokeWidth="3" strokeLinecap="round" />
      {/* Straps (colorful) */}
      <rect x="35" y="38" width="30" height="5" fill="#FF6347" />
      <rect x="35" y="45" width="30" height="5" fill="#87CEEB" />
      <rect x="35" y="52" width="30" height="5" fill="#FFD700" />
      <rect x="35" y="59" width="30" height="5" fill="#90EE90" />
    </svg>
  );
}

// Lottery Ticket Avatar
export function LotteryTicketAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Ticket background */}
      <rect x="20" y="30" width="60" height="40" rx="2" fill="#FFD700" stroke="#333" strokeWidth="2" />
      {/* Ticket edge perforations */}
      <line x1="20" y1="30" x2="80" y2="30" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
      <line x1="20" y1="70" x2="80" y2="70" stroke="#333" strokeWidth="1" strokeDasharray="3,3" />
      {/* Title */}
      <text x="50" y="42" fontSize="10" fill="#333" textAnchor="middle" fontWeight="bold">SCRATCH-OFF</text>
      {/* Scratch area */}
      <rect x="28" y="48" width="44" height="15" rx="2" fill="#C0C0C0" />
      {/* Numbers */}
      <text x="50" y="58" fontSize="8" fill="#333" textAnchor="middle" fontWeight="bold">7 7 7</text>
    </svg>
  );
}

// Rusty Pickup Truck Avatar
export function PickupTruckAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Truck bed */}
      <rect x="45" y="45" width="35" height="20" fill="#8B4513" stroke="#5C3317" strokeWidth="2" />
      {/* Truck cab */}
      <rect x="20" y="48" width="28" height="17" rx="2" fill="#CD853F" stroke="#5C3317" strokeWidth="2" />
      {/* Cab roof */}
      <polygon points="20,48 48,48 44,40 24,40" fill="#8B4513" stroke="#5C3317" strokeWidth="2" />
      {/* Window */}
      <rect x="24" y="42" width="16" height="8" fill="#87CEEB" stroke="#333" strokeWidth="1" />
      {/* Wheels */}
      <circle cx="32" cy="67" r="7" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="68" cy="67" r="7" fill="#333" stroke="#666" strokeWidth="2" />
      <circle cx="32" cy="67" r="4" fill="#888" />
      <circle cx="68" cy="67" r="4" fill="#888" />
      {/* Rust spots */}
      <circle cx="26" cy="55" r="2" fill="#8B4513" opacity="0.6" />
      <circle cx="55" cy="52" r="2.5" fill="#8B4513" opacity="0.6" />
    </svg>
  );
}

// Six Pack Avatar
export function SixPackAvatar({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      {/* Cardboard carrier */}
      <rect x="22" y="35" width="56" height="35" rx="2" fill="#D2691E" stroke="#8B4513" strokeWidth="2" />
      {/* Handle cutout */}
      <ellipse cx="50" cy="35" rx="12" ry="5" fill="#2a2a2a" />
      {/* Beer cans (tops) */}
      <circle cx="35" cy="52" r="8" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
      <circle cx="50" cy="52" r="8" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
      <circle cx="65" cy="52" r="8" fill="#FFD700" stroke="#DAA520" strokeWidth="1.5" />
      {/* Can tabs */}
      <ellipse cx="35" cy="52" rx="3" ry="2" fill="#888" />
      <ellipse cx="50" cy="52" rx="3" ry="2" fill="#888" />
      <ellipse cx="65" cy="52" rx="3" ry="2" fill="#888" />
      {/* "6" on carrier */}
      <text x="50" y="68" fontSize="16" fill="#8B4513" textAnchor="middle" fontWeight="bold">6</text>
    </svg>
  );
}

// Complete avatar set
export const AVATAR_ICONS = [
  { id: 'beer-can', name: 'Beer Can', Component: BeerCanAvatar },
  { id: 'trailer', name: 'Trailer', Component: TrailerAvatar },
  { id: 'food-stamp', name: 'Food Stamp', Component: FoodStampAvatar },
  { id: 'cigarette-pack', name: 'Cigarette Pack', Component: CigarettePackAvatar },
  { id: 'bowling-pin', name: 'Bowling Pin', Component: BowlingPinAvatar },
  { id: 'tv-dinner', name: 'TV Dinner', Component: TVDinnerAvatar },
  { id: 'lawn-chair', name: 'Lawn Chair', Component: LawnChairAvatar },
  { id: 'lottery-ticket', name: 'Lottery Ticket', Component: LotteryTicketAvatar },
  { id: 'pickup-truck', name: 'Pickup Truck', Component: PickupTruckAvatar },
  { id: 'six-pack', name: 'Six Pack', Component: SixPackAvatar },
];

/**
 * Get a random avatar icon
 * Uses player ID as seed for consistency within a game session
 */
export function getRandomAvatarIcon(playerId) {
  // Use playerId as seed for consistent random selection
  const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % AVATAR_ICONS.length;
  return AVATAR_ICONS[index];
}

/**
 * Avatar Icon Wrapper Component
 * Renders the appropriate avatar icon based on avatarId
 */
export function AvatarIcon({ avatarId, playerId, size = 80 }) {
  let avatar;

  if (avatarId) {
    // Use specific avatar if provided
    avatar = AVATAR_ICONS.find(a => a.id === avatarId);
  } else if (playerId) {
    // Use random avatar based on player ID
    avatar = getRandomAvatarIcon(playerId);
  } else {
    // Default to first avatar
    avatar = AVATAR_ICONS[0];
  }

  const IconComponent = avatar.Component;
  return <IconComponent size={size} />;
}
