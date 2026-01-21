/**
 * Curated icon set for collection pins.
 * These icons are chosen for:
 * - Relevance to places and locations
 * - Clear recognition at small sizes (map pins)
 * - Visual variety for different place types
 *
 * Icons are from lucide-react library.
 */

import {
  // Food & Drink
  Coffee,
  UtensilsCrossed,
  Pizza,
  IceCream,
  Cake,
  Wine,
  Beer,
  Martini,
  CupSoda,
  Soup,

  // Shopping & Services
  ShoppingBag,
  ShoppingCart,
  Store,
  Scissors,
  Shirt,
  Gift,

  // Entertainment & Culture
  Music,
  Theater,
  Film,
  Camera,
  Palette,
  BookOpen,
  Landmark,
  Castle,
  Church,

  // Sports & Recreation
  Dumbbell,
  Bike,
  Waves,
  Mountain,
  Tent,
  TreePine,
  Footprints,

  // Travel & Transport
  Plane,
  Train,
  Car,
  Bus,
  Ship,
  Fuel,
  ParkingCircle,
  Hotel,
  Luggage,

  // Health & Wellness
  Heart,
  Hospital,
  Pill,
  Stethoscope,
  Sparkles,

  // Education & Work
  GraduationCap,
  Building2,
  Briefcase,
  Library,

  // Home & Living
  Home,
  Bed,
  Sofa,
  Key,
  Wrench,
  Hammer,

  // Nature & Outdoors
  Sun,
  Flower,
  Leaf,
  Dog,
  Cat,
  Fish,

  // General Place Markers
  MapPin,
  Star,
  Bookmark,
  Flag,
  CircleDot,
  Navigation,
  Compass,
  Globe,

  // Utilities & Services
  Phone,
  Wifi,
  Banknote,
  CreditCard,

  type LucideIcon,
} from 'lucide-react';

export interface PresetIcon {
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Human-readable name */
  name: string;
  /** Category for organization */
  category: string;
}

export const PRESET_ICONS: PresetIcon[] = [
  // General Place Markers (most common - first)
  { icon: MapPin, name: 'Pin', category: 'General' },
  { icon: Star, name: 'Star', category: 'General' },
  { icon: Bookmark, name: 'Bookmark', category: 'General' },
  { icon: Heart, name: 'Heart', category: 'General' },
  { icon: Flag, name: 'Flag', category: 'General' },
  { icon: CircleDot, name: 'Dot', category: 'General' },
  { icon: Navigation, name: 'Navigate', category: 'General' },
  { icon: Compass, name: 'Compass', category: 'General' },

  // Food & Drink
  { icon: Coffee, name: 'Coffee', category: 'Food & Drink' },
  { icon: UtensilsCrossed, name: 'Restaurant', category: 'Food & Drink' },
  { icon: Pizza, name: 'Pizza', category: 'Food & Drink' },
  { icon: IceCream, name: 'Ice Cream', category: 'Food & Drink' },
  { icon: Cake, name: 'Bakery', category: 'Food & Drink' },
  { icon: Wine, name: 'Wine', category: 'Food & Drink' },
  { icon: Beer, name: 'Beer', category: 'Food & Drink' },
  { icon: Martini, name: 'Bar', category: 'Food & Drink' },
  { icon: CupSoda, name: 'Drinks', category: 'Food & Drink' },
  { icon: Soup, name: 'Soup', category: 'Food & Drink' },

  // Shopping & Services
  { icon: ShoppingBag, name: 'Shopping', category: 'Shopping' },
  { icon: ShoppingCart, name: 'Grocery', category: 'Shopping' },
  { icon: Store, name: 'Store', category: 'Shopping' },
  { icon: Scissors, name: 'Salon', category: 'Shopping' },
  { icon: Shirt, name: 'Clothing', category: 'Shopping' },
  { icon: Gift, name: 'Gift Shop', category: 'Shopping' },

  // Entertainment & Culture
  { icon: Music, name: 'Music', category: 'Entertainment' },
  { icon: Theater, name: 'Theater', category: 'Entertainment' },
  { icon: Film, name: 'Cinema', category: 'Entertainment' },
  { icon: Camera, name: 'Photo Spot', category: 'Entertainment' },
  { icon: Palette, name: 'Art', category: 'Entertainment' },
  { icon: BookOpen, name: 'Bookstore', category: 'Entertainment' },
  { icon: Landmark, name: 'Landmark', category: 'Entertainment' },
  { icon: Castle, name: 'Castle', category: 'Entertainment' },
  { icon: Church, name: 'Church', category: 'Entertainment' },

  // Sports & Recreation
  { icon: Dumbbell, name: 'Gym', category: 'Recreation' },
  { icon: Bike, name: 'Cycling', category: 'Recreation' },
  { icon: Waves, name: 'Beach', category: 'Recreation' },
  { icon: Mountain, name: 'Hiking', category: 'Recreation' },
  { icon: Tent, name: 'Camping', category: 'Recreation' },
  { icon: TreePine, name: 'Park', category: 'Recreation' },
  { icon: Footprints, name: 'Walking', category: 'Recreation' },

  // Travel & Transport
  { icon: Plane, name: 'Airport', category: 'Travel' },
  { icon: Train, name: 'Station', category: 'Travel' },
  { icon: Car, name: 'Parking', category: 'Travel' },
  { icon: Bus, name: 'Bus Stop', category: 'Travel' },
  { icon: Ship, name: 'Port', category: 'Travel' },
  { icon: Fuel, name: 'Gas Station', category: 'Travel' },
  { icon: ParkingCircle, name: 'Parking', category: 'Travel' },
  { icon: Hotel, name: 'Hotel', category: 'Travel' },
  { icon: Luggage, name: 'Travel', category: 'Travel' },

  // Health & Wellness
  { icon: Hospital, name: 'Hospital', category: 'Health' },
  { icon: Pill, name: 'Pharmacy', category: 'Health' },
  { icon: Stethoscope, name: 'Doctor', category: 'Health' },
  { icon: Sparkles, name: 'Spa', category: 'Health' },

  // Education & Work
  { icon: GraduationCap, name: 'School', category: 'Education' },
  { icon: Building2, name: 'Office', category: 'Education' },
  { icon: Briefcase, name: 'Work', category: 'Education' },
  { icon: Library, name: 'Library', category: 'Education' },

  // Home & Living
  { icon: Home, name: 'Home', category: 'Home' },
  { icon: Bed, name: 'Bedroom', category: 'Home' },
  { icon: Sofa, name: 'Lounge', category: 'Home' },
  { icon: Key, name: 'Rental', category: 'Home' },
  { icon: Wrench, name: 'Repair', category: 'Home' },
  { icon: Hammer, name: 'Hardware', category: 'Home' },

  // Nature & Outdoors
  { icon: Sun, name: 'Outdoor', category: 'Nature' },
  { icon: Flower, name: 'Garden', category: 'Nature' },
  { icon: Leaf, name: 'Nature', category: 'Nature' },
  { icon: Dog, name: 'Dog Park', category: 'Nature' },
  { icon: Cat, name: 'Pet Shop', category: 'Nature' },
  { icon: Fish, name: 'Aquarium', category: 'Nature' },

  // Utilities & Services
  { icon: Globe, name: 'Attraction', category: 'Services' },
  { icon: Phone, name: 'Call', category: 'Services' },
  { icon: Wifi, name: 'WiFi Spot', category: 'Services' },
  { icon: Banknote, name: 'ATM', category: 'Services' },
  { icon: CreditCard, name: 'Bank', category: 'Services' },
];

/** Default icon for new collections */
export const DEFAULT_ICON = PRESET_ICONS[0]; // MapPin

/**
 * Find a preset icon by its name
 */
export function findIconByName(name: string): PresetIcon | undefined {
  return PRESET_ICONS.find(
    (icon) => icon.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get unique categories from the icon set
 */
export function getIconCategories(): string[] {
  const categories = new Set(PRESET_ICONS.map((icon) => icon.category));
  return Array.from(categories);
}

/**
 * Filter icons by category
 */
export function getIconsByCategory(category: string): PresetIcon[] {
  return PRESET_ICONS.filter((icon) => icon.category === category);
}
