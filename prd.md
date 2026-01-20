# Matchbox PRD

## What is it

Matchbox is a personal place-saving app that makes it effortless to collect and organize locations you want to visit.

**The core idea**: Paste a Google Maps link (or share it directly from the Google Maps app on Android) and Matchbox automatically extracts all the place details—name, address, rating, hours, and more. No typing, no forms, just paste and save.

**Key features**:
- **Effortless saving**: Paste links or share from Google Maps to instantly save places
- **Smart organization**: Group places into customizable collections with colored pins and icons
- **Flexible browsing**: View places on a map or as a list, filter by collection or tags, search across everything
- **Travel-ready**: Mobile-first PWA that works great on your phone while exploring a new city
- **Your data, your way**: Export to JSON or CSV for backup or further use

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
- Displays all saved places as colored pins on a Mapbox map
- Each collection has a customizable pin color and icon (from an icon library, ~50-80 icons)
- Clicking a pin opens place details:
  - Mobile: slide-up panel from bottom
  - Desktop: side panel
- Default view: zoom to show all saved places (empty state: centered on London, UK)
- Filter places by collections or tags (AND logic for multiple filters)
- Global search across place names, notes, and tags
- Click collection name to zoom/fit all its places on map
- Context menu (right-click desktop, long-press mobile): Edit, Move to collection, Copy address, Navigate, Delete
- Color palette for pins: ~12-16 curated preset colors

### Place Details
When viewing a place, display:
- Place name
- Address (with copy to clipboard button)
- Google Maps link
- Rating (if available)
- Opening hours (if available)
- Website (if available)
- Phone number (if available)
- Collection it belongs to (clickable - navigates to that collection's places on map)
- User-added notes (plain text)
- User-added tags (free-form, clickable - filters map view by that tag)
- Button to open navigation (Google Maps or other apps)
- Button to copy address to clipboard

### List View
- Alternative to map view: browse places as a list organized by collection
- Sorting options:
  - By date added (newest/oldest first)
  - Alphabetically (A-Z / Z-A)

### Adding Places (Key Feature)
- **Paste to add**: Simply pasting a Google Maps link anywhere in the app triggers place detection
- Auto-extracts: place name, address, coordinates, Google Maps link, rating, opening hours, website, phone number
- Uses free alternatives (web scraping/geocoding) instead of Google Places API
- After paste, prompts user to select which collection to save to
- Can paste multiple links at once
- **Mobile**: Share sheet integration via PWA (Android) + visible paste button always shown
- **Manual entry**: Option to add places by typing name/address (geocoded to get coordinates)
- **Error handling**: If link processing fails, show error and offer manual entry fallback
- **Duplicates**: Warn if place already exists (by coordinates or link) but allow adding anyway

### Collections
- Create, edit, delete collections
- Customize: name, pin color (preset palette), pin icon (from icon library)
- One default "My Places" collection auto-created on first place add (can be renamed/deleted)

### Place Management
- Edit places: name, notes, tags, collection
- Move places between collections
- Soft delete: deleted places go to trash, recoverable for 30 days

### Export & Backup
- Export to JSON format (serves as both data export and backup)
- Import from JSON to restore data
- Export to CSV/spreadsheet format

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
- **Mobile-first**: Optimized for phone use while traveling, scales up for desktop
- **Online only**: Requires internet connection (no offline support)

## Empty State

- Map centered on London, UK
- Prompt: "Paste a Google Maps link to get started"

## Data Limits

- Soft limits with warnings: No hard caps, but warn users if data is getting very large (performance reasons)

## Future Features

(Not in initial release)

1. **Full authentication**: Proper login system with email/password for multi-user support
2. **Place thumbnails**: Save photos of places
3. **Distance sorting**: Sort by distance from current GPS location
4. **Custom ordering**: Drag-and-drop manual arrangement of places
5. **Center on user location**: Default map view option to center on GPS
6. **Web scraping for articles**: Paste article link, extract list of places immediately
7. **Multi-collection places**: Places belonging to more than one collection
8. **Additional export formats**: PDF/printable, Google Maps list
9. **Pin clustering**: Group nearby pins when zoomed out (optional toggle)
10. **Keyboard shortcuts**: V for view toggle, / for search, Escape to close, etc.
11. **Read Later for articles**: Save article links to process later (alternative to immediate extraction)
