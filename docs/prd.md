# Matchbook PRD

## What is it

Matchbook is a personal place-saving app that makes it effortless to collect and organize locations you want to visit.

**The core idea**: Paste a Google Maps link (or share it directly from the Google Maps app on Android) and Matchbook automatically extracts all the place details—name, address, rating, hours, and more. No typing, no forms, just paste and save.

**Key features**:
- **Effortless saving**: Paste links or share from Google Maps to instantly save places
- **Smart organization**: Group places into customizable collections with emojis
- **Flexible browsing**: Map view with slide-up panels for exploring collections and places as lists
- **Travel-ready**: Mobile-first PWA that works great on your phone while exploring a new city
- **Your data**: Places stored securely in your personal database

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

### Collection Management
- Create, edit, delete collections
- Customize: name, emoji (curated set organized by category)
- One default "My Places" collection auto-created on first place add (can be renamed/deleted)

### Place Management
- Edit places: name, collection
- Move places between collections

### Authentication
- Simple password protection (single password for app access)
- Password set during initial setup
- Stay logged in on device (persistent session until explicit logout)

## User Stories

This section documents all user interactions with step-by-step descriptions of how features work.

### First-Time Setup

**Goal**: Create a password to secure the app

1. User opens Matchbook for the first time
2. Sees setup screen with password fields
3. Enters password (minimum 8 characters)
4. Confirms password in second field
5. Clicks "Set Password" button
6. Redirected to login page

### Logging In

**Goal**: Access the app with password

1. User opens Matchbook
2. Sees login screen with password field
3. Enters password
4. Clicks "Login" button
5. If correct: Sees map view with any saved places
6. If incorrect: Sees "Incorrect password" error

### Logging Out

**Goal**: Sign out of the app

1. User clicks logout button (top-right corner)
2. Session cleared, redirected to login page

---

### Adding a Place by Pasting a Link

**Goal**: Save a place from Google Maps

1. User copies a Google Maps link from browser or app
2. User presses Ctrl+V (or Cmd+V) anywhere in Matchbook
3. App detects the Google Maps URL and shows loading indicator
4. "Add Place" modal opens showing:
   - Place name (extracted from Google)
   - Address
   - "View on Maps" link
5. User selects a collection from dropdown
6. User clicks "Save"
7. Success toast: "[Place Name] added to your collection!"
8. Place appears as a pin on the map

### Adding a Place via Paste Button (Mobile)

**Goal**: Save a place on mobile without keyboard shortcut

1. User copies a Google Maps link
2. User taps "Paste Link" button (orange, bottom center)
3. Same flow as above: modal opens, user selects collection, saves

### Adding a Place Manually

**Goal**: Save a place by typing name/address

1. User clicks "Add Place" button (top-right, plus icon)
2. Modal opens with form fields:
   - Name (required)
   - Address (required)
   - Collection dropdown
3. User types place name and address
4. User selects a collection
5. User clicks "Save"
6. App searches Google Maps for the location
7. If found: Place saved, appears on map
8. If not found: Error message shown

### Handling Duplicate Places

**Goal**: Avoid accidentally saving the same place twice

1. User pastes/adds a place that already exists
2. Warning modal appears showing:
   - "This place may already exist"
   - Existing place name and collection
   - How it was matched (coordinates or URL)
3. User can click "Add Anyway" to save it anyway
4. Or click "Cancel" to discard

### Sharing from Google Maps (Android)

**Goal**: Save a place directly from Google Maps app

1. User has Matchbook installed as PWA
2. In Google Maps app, user taps Share on a place
3. User selects "Matchbook" from share menu
4. Matchbook opens with "Add Place" modal pre-filled
5. User selects collection and saves

---

### Viewing a Place on the Map

**Goal**: See details of a saved place

1. User sees pins on the map (white with emoji icons)
2. User clicks/taps a pin
3. Place details panel slides up from bottom showing:
   - Place name
   - Place types (e.g., "Italian Restaurant")
   - Collection badge (clickable)
   - Address with "Copy address" button
   - Rating with stars (if available)
   - Opening hours with "Open/Closed" badge (if available)
   - Website link (if available)
   - Phone number (if available)
4. Two action buttons at bottom:
   - "Get Directions" (opens Google Maps navigation)
   - "View on Google Maps" (opens original link)

### Copying a Place's Address

**Goal**: Copy address to use elsewhere

1. User opens place details panel
2. User clicks "Copy address" button below address
3. Button changes to "Copied!" with checkmark
4. Address is in clipboard

### Getting Directions to a Place

**Goal**: Navigate to a saved place

1. User opens place details panel
2. User clicks "Get Directions" button
3. Google Maps opens in new tab with directions from current location

---

### Editing a Place

**Goal**: Change a place's name or collection

1. User opens place details panel
2. User clicks edit button (pencil icon, top-right)
3. Edit modal opens with:
   - Name field (pre-filled)
   - Collection dropdown (pre-selected)
   - "Delete this place" link (red)
4. User makes changes
5. User clicks "Save"
6. Success toast: "[Place Name] updated successfully!"
7. Panel shows updated information

### Moving a Place to Another Collection

**Goal**: Reorganize places between collections

**Method 1 - Via Edit Modal:**
1. User opens place details panel
2. User clicks edit button
3. User changes collection in dropdown
4. User clicks "Save"

**Method 2 - Via Context Menu:**
1. User right-clicks a pin (desktop) or long-presses (mobile)
2. Context menu appears with place name
3. User hovers/taps "Move to"
4. Submenu shows all other collections
5. User clicks destination collection
6. Place moves immediately, pin updates

---

### Viewing Collections

**Goal**: See all collections and their places

1. User clicks "Collections" button (top-right, layers icon)
2. Collections panel slides up from bottom showing:
   - List of all collections with emoji + name + place count
3. Each collection shows count: "5 places" or "1 place"

### Creating a New Collection

**Goal**: Organize places into a new category

1. User opens collections panel
2. User clicks "+" button in header
3. "New Collection" modal opens with:
   - Name field
   - Emoji picker grid (organized by category)
   - Live preview of emoji + name
4. User types collection name
5. User selects an emoji from the grid
6. User clicks "Create"
7. New collection appears in list

### Editing a Collection

**Goal**: Change collection name or emoji

1. User opens collections panel
2. User clicks pencil icon on a collection (or opens collection then clicks edit)
3. "Edit Collection" modal opens with:
   - Name field (pre-filled)
   - Emoji picker (current emoji selected)
   - "Delete this collection" link
4. User makes changes
5. User clicks "Save"
6. Collection updates in list, pins update on map

### Deleting a Collection

**Goal**: Remove a collection

1. User opens edit modal for a collection
2. User clicks "Delete this collection"
3. Confirmation: "When you delete a collection, its places are moved to [Default Collection]."
4. User clicks "Delete"
5. Collection removed from list
6. Places moved to oldest remaining collection

### Browsing Places in a Collection

**Goal**: See all places in one collection

1. User opens collections panel
2. User clicks on a collection name
3. Panel transitions to show:
   - Back button
   - Collection emoji + name + place count
   - Sort dropdown (if 2+ places)
   - List of places with name, address, date added
4. Map filters to show only pins from this collection
5. User can click any place to view details

### Sorting Places in a Collection

**Goal**: Change the order of places in a list

1. User is viewing places in a collection
2. User clicks sort dropdown (shows current sort)
3. Options appear: Newest, Oldest, A-Z, Z-A
4. User selects an option
5. List reorders immediately

---

### Filtering Map by Collection

**Goal**: Show only places from one collection on map

**Method 1 - Via Collections Panel:**
1. User opens collections panel
2. User clicks a collection
3. Map shows only that collection's pins

**Method 2 - Via Place Details:**
1. User opens place details panel
2. User clicks collection badge (e.g., "🍔 Restaurants")
3. Panel closes, map filters to that collection

### Clearing Collection Filter

**Goal**: Show all places on map again

1. User is viewing a filtered collection
2. User clicks back button in collections panel
3. Map shows all places again

### Using My Location

**Goal**: Center map on current position

1. User clicks location button (bottom center, near Paste Link)
2. If first time: Browser asks for location permission
3. If granted: Map flies to user's location, blue pulsing dot appears
4. If denied: Toast: "Location access denied. Check your browser settings."

---

### Using the Context Menu

**Goal**: Quick access to place actions

**Desktop:**
1. User right-clicks on a map pin
2. Context menu appears with:
   - Place name (header)
   - Edit
   - Move to → (submenu with collections)
   - Copy address
   - Get directions

**Mobile:**
1. User long-presses a map pin (hold ~0.5 second)
2. Same context menu appears

### Navigating with Back Button

**Goal**: Go back through panels

1. From place details panel: Back closes panel, returns to map (or collection list if came from there)
2. From collection places list: Back returns to collections list
3. From collections panel: Back closes panel, shows map
4. Android back button works the same way

---

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
20. **Trash with soft-delete**: Soft-delete places to trash with 30-day recovery period
