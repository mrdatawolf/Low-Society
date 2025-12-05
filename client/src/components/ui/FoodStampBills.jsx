/**
 * FoodStampBills Component
 *
 * Low Society themed food stamp bills using CSS/SVG
 * Different denominations with themed designs
 */

// Base Food Stamp Bill Component
function FoodStampBill({ value, size = 'medium', isAvailable = true, isSelected = false, onClick }) {
  const sizes = {
    small: { width: 60, height: 30, fontSize: 10 },
    medium: { width: 90, height: 45, fontSize: 14 },
    large: { width: 120, height: 60, fontSize: 18 },
  };

  const dims = sizes[size];

  // Color scheme based on denomination (like real currency)
  const getColorScheme = (val, isUsed) => {
    if (isUsed) {
      // Much darker colors for used bills
      return { bg: '#2a2a2a', border: '#1a1a1a', text: '#555555' };
    }

    if (val <= 2) return { bg: '#90EE90', border: '#2F4F2F', text: '#1B4D1B' }; // Light green
    if (val <= 5) return { bg: '#98D8C8', border: '#2F6F5F', text: '#1B4D3B' }; // Mint
    if (val <= 10) return { bg: '#87CEEB', border: '#4682B4', text: '#1E3A5F' }; // Sky blue
    if (val <= 15) return { bg: '#DDA0DD', border: '#8B008B', text: '#4B0082' }; // Plum
    return { bg: '#F0E68C', border: '#DAA520', text: '#8B6914' }; // Khaki/gold
  };

  const colors = getColorScheme(value, !isAvailable);

  return (
    <svg
      width={dims.width}
      height={dims.height}
      viewBox={`0 0 ${dims.width} ${dims.height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{
        cursor: onClick ? 'pointer' : 'default',
        opacity: isAvailable ? 1 : 0.5,
        filter: isSelected ? 'brightness(1.2)' : 'none',
        transition: 'all 0.2s ease',
      }}
      onClick={onClick}
      className={`food-stamp-bill ${isSelected ? 'selected' : ''} ${!isAvailable ? 'unavailable' : ''}`}
    >
      {/* Bill background */}
      <rect
        x="2"
        y="2"
        width={dims.width - 4}
        height={dims.height - 4}
        rx="3"
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth="2"
      />

      {/* Border pattern (like security features) */}
      <rect
        x="5"
        y="5"
        width={dims.width - 10}
        height={dims.height - 10}
        rx="2"
        fill="none"
        stroke={colors.border}
        strokeWidth="1"
        strokeDasharray="2,2"
        opacity="0.5"
      />

      {/* Dollar sign */}
      <text
        x={dims.width * 0.25}
        y={dims.height * 0.65}
        fontSize={dims.fontSize * 1.5}
        fill={colors.text}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        $
      </text>

      {/* Value */}
      <text
        x={dims.width * 0.65}
        y={dims.height * 0.65}
        fontSize={dims.fontSize * 1.5}
        fill={colors.text}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
      >
        {value}
      </text>

      {/* "FOOD" text at top */}
      <text
        x={dims.width * 0.5}
        y={dims.height * 0.3}
        fontSize={dims.fontSize * 0.5}
        fill={colors.text}
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
        textAnchor="middle"
        opacity="0.7"
      >
        FOOD
      </text>

      {/* Selection indicator */}
      {isSelected && (
        <rect
          x="1"
          y="1"
          width={dims.width - 2}
          height={dims.height - 2}
          rx="4"
          fill="none"
          stroke="#FFD700"
          strokeWidth="3"
        />
      )}
    </svg>
  );
}

// Money Hand Component - Displays player's money as food stamp bills
export function MoneyHand({ moneyCards, onMoneyClick, selectedMoney = [] }) {
  if (!moneyCards || moneyCards.length === 0) {
    return (
      <div className="money-hand empty">
        <span className="empty-message">No money left</span>
      </div>
    );
  }

  return (
    <div className="money-hand">
      {moneyCards.map((moneyCard) => (
        <div
          key={moneyCard.id}
          className="money-card-wrapper"
          style={{
            position: 'relative',
            display: 'inline-block',
            margin: '0 4px',
          }}
        >
          <FoodStampBill
            value={moneyCard.value}
            size="medium"
            isAvailable={moneyCard.available}
            isSelected={selectedMoney.includes(moneyCard.id)}
            onClick={() => moneyCard.available && onMoneyClick && onMoneyClick(moneyCard)}
          />
        </div>
      ))}
    </div>
  );
}

// Bid Pot Component - Shows total bid amount as stacked bills
export function BidPot({ amount, playerName }) {
  if (!amount || amount === 0) return null;

  // Break down amount into bill denominations (for visual effect)
  const getBillBreakdown = (total) => {
    const bills = [];
    const denominations = [25, 20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
    let remaining = total;

    for (const denom of denominations) {
      while (remaining >= denom) {
        bills.push(denom);
        remaining -= denom;
        if (bills.length >= 5) break; // Max 5 bills for display
      }
      if (bills.length >= 5) break;
    }

    return bills;
  };

  const bills = getBillBreakdown(amount);

  return (
    <div className="bid-pot">
      <div className="bid-pot-bills">
        {bills.map((value, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${index * 8}px`,
              top: `${index * 3}px`,
              zIndex: index,
            }}
          >
            <FoodStampBill value={value} size="small" />
          </div>
        ))}
      </div>
      <div className="bid-pot-info">
        <span className="bid-player">{playerName}</span>
        <span className="bid-total">${amount}</span>
      </div>
    </div>
  );
}

// Money Display Component - Shows remaining money for a player
export function MoneyDisplay({ amount, size = 'medium', showLabel = true }) {
  if (amount === 0) {
    return (
      <div className="money-display empty">
        {showLabel && <span className="money-label">Money:</span>}
        <span className="money-amount">$0</span>
      </div>
    );
  }

  // Show a single representative bill for the largest denomination
  const getRepresentativeBill = (total) => {
    const denominations = [25, 20, 15, 12, 10, 8, 6, 5, 4, 3, 2, 1];
    for (const denom of denominations) {
      if (total >= denom) return denom;
    }
    return 1;
  };

  const billValue = getRepresentativeBill(amount);

  return (
    <div className="money-display">
      {showLabel && <span className="money-label">Money:</span>}
      <div className="money-icon">
        <FoodStampBill value={billValue} size={size} />
      </div>
      <span className="money-amount">${amount}</span>
    </div>
  );
}

// Export individual bill for custom use
export { FoodStampBill };
