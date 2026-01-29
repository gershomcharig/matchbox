/**
 * Curated emoji set for collection pins.
 * These emojis are chosen for:
 * - Relevance to places and locations
 * - Clear recognition at small sizes (map pins)
 * - Visual variety for different place types
 * - Universal cross-platform rendering
 */

export interface PresetEmoji {
  /** The emoji character: "☕" */
  emoji: string;
  /** Human-readable name for search: "Coffee" */
  name: string;
  /** Category for filtering: "Food & Drink" */
  category: string;
}

export const PRESET_EMOJIS: PresetEmoji[] = [
  // General Place Markers (most common - first)
  { emoji: '📍', name: 'Pin', category: 'General' },
  { emoji: '⭐', name: 'Star', category: 'General' },
  { emoji: '🔖', name: 'Bookmark', category: 'General' },
  { emoji: '❤️', name: 'Heart', category: 'General' },
  { emoji: '🏠', name: 'Home', category: 'General' },
  { emoji: '📌', name: 'Pushpin', category: 'General' },
  { emoji: '🎯', name: 'Target', category: 'General' },
  { emoji: '✨', name: 'Sparkles', category: 'General' },
  { emoji: '🚩', name: 'Flag', category: 'General' },
  { emoji: '💡', name: 'Lightbulb', category: 'General' },

  // Food & Drink
  { emoji: '☕', name: 'Coffee', category: 'Food & Drink' },
  { emoji: '🍕', name: 'Pizza', category: 'Food & Drink' },
  { emoji: '🍔', name: 'Burger', category: 'Food & Drink' },
  { emoji: '🍜', name: 'Noodles', category: 'Food & Drink' },
  { emoji: '🍣', name: 'Sushi', category: 'Food & Drink' },
  { emoji: '🍦', name: 'Ice Cream', category: 'Food & Drink' },
  { emoji: '🍰', name: 'Cake', category: 'Food & Drink' },
  { emoji: '🍷', name: 'Wine', category: 'Food & Drink' },
  { emoji: '🍺', name: 'Beer', category: 'Food & Drink' },
  { emoji: '🍹', name: 'Cocktail', category: 'Food & Drink' },
  { emoji: '🥗', name: 'Salad', category: 'Food & Drink' },
  { emoji: '🥐', name: 'Croissant', category: 'Food & Drink' },
  { emoji: '🍵', name: 'Tea', category: 'Food & Drink' },
  { emoji: '🧁', name: 'Cupcake', category: 'Food & Drink' },
  { emoji: '🍩', name: 'Donut', category: 'Food & Drink' },
  { emoji: '🥡', name: 'Takeout', category: 'Food & Drink' },

  // Shopping
  { emoji: '🛍️', name: 'Shopping', category: 'Shopping' },
  { emoji: '🛒', name: 'Grocery', category: 'Shopping' },
  { emoji: '🏪', name: 'Store', category: 'Shopping' },
  { emoji: '💈', name: 'Barber', category: 'Shopping' },
  { emoji: '👕', name: 'Clothing', category: 'Shopping' },
  { emoji: '🎁', name: 'Gift', category: 'Shopping' },
  { emoji: '💎', name: 'Jewelry', category: 'Shopping' },
  { emoji: '👟', name: 'Shoes', category: 'Shopping' },
  { emoji: '💄', name: 'Beauty', category: 'Shopping' },
  { emoji: '📦', name: 'Package', category: 'Shopping' },

  // Entertainment
  { emoji: '🎬', name: 'Cinema', category: 'Entertainment' },
  { emoji: '🎭', name: 'Theater', category: 'Entertainment' },
  { emoji: '🎵', name: 'Music', category: 'Entertainment' },
  { emoji: '🎨', name: 'Art', category: 'Entertainment' },
  { emoji: '🎮', name: 'Gaming', category: 'Entertainment' },
  { emoji: '📚', name: 'Books', category: 'Entertainment' },
  { emoji: '🏛️', name: 'Museum', category: 'Entertainment' },
  { emoji: '🎪', name: 'Circus', category: 'Entertainment' },
  { emoji: '🎤', name: 'Karaoke', category: 'Entertainment' },
  { emoji: '🎸', name: 'Live Music', category: 'Entertainment' },

  // Recreation
  { emoji: '🏃', name: 'Running', category: 'Recreation' },
  { emoji: '🚴', name: 'Cycling', category: 'Recreation' },
  { emoji: '🏊', name: 'Swimming', category: 'Recreation' },
  { emoji: '🧗', name: 'Climbing', category: 'Recreation' },
  { emoji: '⛷️', name: 'Skiing', category: 'Recreation' },
  { emoji: '🏕️', name: 'Camping', category: 'Recreation' },
  { emoji: '🌲', name: 'Park', category: 'Recreation' },
  { emoji: '👣', name: 'Hiking', category: 'Recreation' },
  { emoji: '⚽', name: 'Soccer', category: 'Recreation' },
  { emoji: '🎾', name: 'Tennis', category: 'Recreation' },

  // Travel
  { emoji: '✈️', name: 'Airport', category: 'Travel' },
  { emoji: '🚂', name: 'Train', category: 'Travel' },
  { emoji: '🚗', name: 'Car', category: 'Travel' },
  { emoji: '🚌', name: 'Bus', category: 'Travel' },
  { emoji: '🚢', name: 'Ship', category: 'Travel' },
  { emoji: '⛽', name: 'Gas Station', category: 'Travel' },
  { emoji: '🅿️', name: 'Parking', category: 'Travel' },
  { emoji: '🏨', name: 'Hotel', category: 'Travel' },
  { emoji: '🗼', name: 'Tower', category: 'Travel' },
  { emoji: '🗽', name: 'Landmark', category: 'Travel' },

  // Health
  { emoji: '🏥', name: 'Hospital', category: 'Health' },
  { emoji: '💊', name: 'Pharmacy', category: 'Health' },
  { emoji: '🏋️', name: 'Gym', category: 'Health' },
  { emoji: '🧘', name: 'Yoga', category: 'Health' },
  { emoji: '💉', name: 'Clinic', category: 'Health' },
  { emoji: '🩺', name: 'Doctor', category: 'Health' },
  { emoji: '💆', name: 'Spa', category: 'Health' },
  { emoji: '🧖', name: 'Sauna', category: 'Health' },

  // Education
  { emoji: '🏫', name: 'School', category: 'Education' },
  { emoji: '📖', name: 'Library', category: 'Education' },
  { emoji: '🎓', name: 'University', category: 'Education' },
  { emoji: '💼', name: 'Office', category: 'Education' },
  { emoji: '🔬', name: 'Science', category: 'Education' },
  { emoji: '📐', name: 'Math', category: 'Education' },
  { emoji: '✏️', name: 'Study', category: 'Education' },
  { emoji: '🖥️', name: 'Tech', category: 'Education' },

  // Nature
  { emoji: '🌳', name: 'Trees', category: 'Nature' },
  { emoji: '🌊', name: 'Beach', category: 'Nature' },
  { emoji: '🏔️', name: 'Mountain', category: 'Nature' },
  { emoji: '🌸', name: 'Garden', category: 'Nature' },
  { emoji: '🌻', name: 'Flowers', category: 'Nature' },
  { emoji: '🍂', name: 'Fall', category: 'Nature' },
  { emoji: '⛱️', name: 'Umbrella', category: 'Nature' },
  { emoji: '🏖️', name: 'Seaside', category: 'Nature' },

  // Services
  { emoji: '🏦', name: 'Bank', category: 'Services' },
  { emoji: '🏣', name: 'Post Office', category: 'Services' },
  { emoji: '✂️', name: 'Salon', category: 'Services' },
  { emoji: '🔧', name: 'Repair', category: 'Services' },
  { emoji: '🚿', name: 'Laundry', category: 'Services' },
  { emoji: '🧹', name: 'Cleaning', category: 'Services' },
  { emoji: '📮', name: 'Mail', category: 'Services' },
  { emoji: '🔑', name: 'Keys', category: 'Services' },
];

/** Default emoji for new collections */
export const DEFAULT_EMOJI = PRESET_EMOJIS[0]; // 📍

/**
 * Find a preset emoji by its character
 */
export function findEmojiByChar(char: string): PresetEmoji | undefined {
  return PRESET_EMOJIS.find((e) => e.emoji === char);
}

/**
 * Get unique categories from the emoji set
 */
export function getEmojiCategories(): string[] {
  const categories = new Set(PRESET_EMOJIS.map((e) => e.category));
  return Array.from(categories);
}

/**
 * Filter emojis by category
 */
export function getEmojisByCategory(category: string): PresetEmoji[] {
  return PRESET_EMOJIS.filter((e) => e.category === category);
}

/**
 * Check if a value is a legacy Lucide icon name (not an emoji character)
 * Legacy icon names are multi-character strings that aren't emojis
 */
export function isLegacyIconName(value: string): boolean {
  if (!value) return true;
  // Emoji characters are typically 1-2 chars, or use variation selectors
  // Legacy icon names are readable English words like "Pin", "Coffee", "Star"
  // Check if it's a known preset emoji character
  const isKnownEmoji = PRESET_EMOJIS.some((e) => e.emoji === value);
  if (isKnownEmoji) return false;
  // If it's not a known emoji, assume it's a legacy name
  return true;
}
