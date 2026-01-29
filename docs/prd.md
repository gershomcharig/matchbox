# Matchbook PRD

## What is it

Matchbook is a personal place-saving app that makes it effortless to collect and organize locations you want to visit.

**The core idea**: Paste a Google Maps link (or share it directly from the Google Maps app on Android) and Matchbook automatically extracts all the place details—name, address, rating, hours, and more. No typing, no forms, just paste and save.

**Key features**:
- **Effortless saving**: Paste links or share from Google Maps to instantly save places
- **Smart organization**: Group places into customizable collections with colored pins and icons
- **Flexible browsing**: Map view with slide-up panels for exploring collections and places as lists
- **Travel-ready**: Mobile-first PWA that works great on your phone while exploring a new city
- **Your data**: Places stored securely with soft-delete and 30-day trash recovery

## Target User

Single user (personal use). The app will be password-protected to keep data private when deployed online.

## Tech Stack

- **Frontend**: Next.js (React framework)
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Vercel
- **Maps**: Mapbox
- **PWA**: Progressive Web App for mobile share sheet integration
- **Styling**: Minimal & clean design, mobile-first responsive, no visible branding

## Core Features

### Map View (Main View)
- Displays saved places as white pins with emojis on a Mapbox map
- Each collection has a customizable emoji (~88 place-relevant emojis)
- Clicking a pin opens place details in a slide-up panel
- Default view: zoom to show all saved places (empty state: centered on London, UK)
- **Filtering**:
  - Select a collection in the collections panel to filter map to only those places
- Context menu (long-press on mobile): Edit, Move to collection, Copy address, Navigate, Delete

### Place Details
When viewing a place, display:
- Place name
- Address (with copy to clipboard button)
- Google Maps link
- Rating (if available)
- Opening hours (if available)
- Website (if available)
- Phone number (if available)
- Collection it belongs to (clickable - filters map to that collection)
- Button to open navigation (Google Maps or other apps)
- Button to copy address to clipboard

### Adding Places (Key Feature)

**Primary input methods**:
1. **Paste shortened Google Maps URL**: Links like `https://maps.app.goo.gl/...` (copied from Google Maps share button)
2. **Paste full Google Maps URL**: Links like `https://www.google.com/maps/place/...` (copied from browser address bar)
3. **Android share sheet**: Share directly from Google Maps app to Matchbook via the native Android share panel (requires PWA installation)

**How it works**:
- Simply pasting a Google Maps link anywhere in the app triggers place detection
- Auto-extracts: place name, address, coordinates, Google Maps link, rating, opening hours, website, phone number
- After paste, prompts user to select which collection to save to
- Can paste multiple links at once
- **Mobile**: Share sheet integration via PWA (Android) + visible paste button always shown
- **Manual entry**: Option to add places by typing name/address (geocoded to get coordinates)
- **Error handling**: If link processing fails, show error and offer manual entry fallback
- **Duplicates**: Warn if place already exists (by coordinates or link) but allow adding anyway

### How Place Data Extraction Works

Matchbook uses the **Google Maps Places API (New)** to extract accurate place data. This ensures names, addresses, and coordinates match exactly what you see on Google Maps.

#### Pasting Google Maps Links

When you paste a Google Maps link (desktop or mobile paste button):

1. **URL Expansion**: Shortened links (maps.app.goo.gl) are expanded via HTTP redirects
2. **Place ID Extraction**: The Place ID is extracted from the URL (various formats supported)
3. **Places API Call**: Uses Google's Place Details API to get authoritative data:
   - **Name**: Official place name
   - **Address**: Formatted address (exact as shown on Google Maps)
   - **Coordinates**: Precise latitude/longitude
   - **Phone, Website, Hours**: If available
4. **Fallback Search**: If no Place ID in URL, uses Text Search with the place name

**Technical note**: Uses Google Maps Places API (New) with field masking to minimize costs. Within the $200/month free tier, typical personal usage costs $1-3/month.

#### Sharing from Google Maps (Android)

On Android, you can share directly from the Google Maps app to Matchbook using the system share sheet:

1. **Share Target**: The PWA registers as a share target via the Web App Manifest
2. **Receive Link**: When you share from Google Maps, Matchbook receives the URL via `/share` route
3. **Places API Extraction**: The shared link is processed using the same Places API approach
4. **Add to Collection**: You're prompted to select a collection, then the place is saved

**Note**: This requires installing Matchbook as a PWA on Android. iOS does not support the Share Target API.

#### Manual Place Entry

When adding a place manually by typing name/address:

1. User enters a place name and/or address
2. Uses **Google Maps Text Search API** to find the place
3. Returns accurate coordinates and formatted address from Google
4. Place is saved with the search result data

This ensures manual entries also get accurate Google Maps data, unlike previous Nominatim-based geocoding which could return different addresses.

### Collections Panel (Primary Navigation)
The collections panel is the main way to explore places in list format. It opens as a slide-up panel from the bottom of the screen.

- **Collections list**: Shows all collections with place counts
- **Collection drill-down**: Click a collection to:
  - Show a sorted list of places in that collection (newest, oldest, A-Z, Z-A)
  - Automatically filter map pins to only show places from that collection
  - Back button returns to collections list and clears filter
- **Trash**: Appears as a special item at the bottom of the collections list
  - Shows deleted places with days remaining until permanent deletion
  - Restore or permanently delete places from trash
  - Trashed places do not appear on the map

### Collection Management
- Create, edit, delete collections
- Customize: name, emoji (curated set organized by category)
- One default "My Places" collection auto-created on first place add (can be renamed/deleted)

### Place Management
- Edit places: name, collection
- Move places between collections
- Soft delete: deleted places go to Trash (accessible via collections panel), recoverable for 30 days

### Authentication
- Simple password protection (single password for app access)
- Password set during initial setup
- Stay logged in on device (persistent session until explicit logout)

## Progressive Web App (PWA)
- Manifest.json with app name, icons, theme colors
- Service worker for PWA features
- Installable on mobile home screen
- Share Target API support (Android only - receives shared links from other apps)
- iOS users: install to home screen + use paste button (Share Target not supported on iOS)

## Design Principles

- **Minimal & clean**: Simple UI, lots of white space, focus on map and content
- **No visible branding**: Functional UI without prominent app name/logo
- **Mobile-first**: Single mobile-optimized interface (slide-up panels, floating buttons). Works on desktop by resizing the browser window.
- **Online only**: Requires internet connection (no offline support)

## Empty State

- Map centered on London, UK
- Prompt: "Paste a Google Maps link to get started"

## Data Limits

- Soft limits with warnings: No hard caps, but warn users if data is getting very large (performance reasons)

## Future Features

(Not in initial release)

1. **Export & Import**: Export to JSON/CSV for backup, import from JSON to restore
2. **Full authentication**: Proper login system with email/password for multi-user support
3. **Place thumbnails**: Save photos of places
4. **Distance sorting**: Sort by distance from current GPS location
5. **Custom ordering**: Drag-and-drop manual arrangement of places
6. **Center on user location**: Default map view option to center on GPS
7. **Web scraping for articles**: Paste article link, extract list of places immediately
8. **Multi-collection places**: Places belonging to more than one collection
9. **Additional export formats**: PDF/printable, Google Maps list
10. **Pin clustering**: Group nearby pins when zoomed out (optional toggle)
11. **Keyboard shortcuts**: V for view toggle, / for search, Escape to close, etc.
12. **Read Later for articles**: Save article links to process later (alternative to immediate extraction)
13. Make "Paste link" button more visible if a google maps URL (both full-size or shortened) is detected in the clipboard.
14. **Import Google Maps lists**: Paste a link to a Google Maps list to import all places at once into a new collection named after the original list
15. **Collection custom colors**: Colorful pin markers and collection badges (currently all white)
16. **Tags on places**: User-added tags for categorization and filtering
17. **Notes on places**: User-added notes for personal annotations
18. **Search functionality**: Global search across place names, addresses, and notes
19. **Tag filtering**: Filter map view by tags
