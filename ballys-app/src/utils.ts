export const CASINO_ADJECTIVES = [
    'Lucky', 'Golden', 'Royal', 'Wild', 'Super', 'Mega', 'High', 'Winning', 'Jackpot', 'Fortune',
    'Ace', 'King', 'Queen', 'Diamond', 'Platinum', 'Vip', 'Grand', 'Elite', 'Prime', 'Rich'
];

export const CASINO_NOUNS = [
    'Player', 'Roller', 'Spinner', 'Winner', 'Chip', 'Card', 'Dice', 'Slots', 'Wheel', 'Bet',
    'Hand', 'Table', 'Dealer', 'Token', 'Coin', 'Star', 'Guest', 'Member', 'Shark', 'Whale'
];

export const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const generateUsername = () => {
    const adj = CASINO_ADJECTIVES[Math.floor(Math.random() * CASINO_ADJECTIVES.length)];
    const noun = CASINO_NOUNS[Math.floor(Math.random() * CASINO_NOUNS.length)];
    const num = Math.floor(Math.random() * 999);
    return `${adj}${noun}${num}`;
};
