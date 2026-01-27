# Matchbook Development Roadmap

This roadmap sequences the build in small, testable steps. Each step should be completable and verifiable before moving to the next. This supports a "vibe coding" approach where we build incrementally and catch bugs early.

**Approach**: Build small, test often, commit frequently.

---

## Phase 0: Project Setup

### 0.1 Initialize Next.js
- [x] Create Next.js project with App Router
- [x] Verify dev server runs (`npm run dev`)
- [x] **Test**: See default Next.js page at localhost:3000

### 0.2 Tailwind CSS
- [x] Install and configure Tailwind CSS
- [x] **Test**: Add a colored div, verify styling works

### 0.3 Environment & Git
- [x] Create `.env.local.example` listing required variables
- [x] Verify `.gitignore` excludes `.env.local`, `node_modules`, `.next`
- [x] **Test**: Commit and push, verify no secrets in repo

### 0.4 Project Structure
- [x] Create folder structure: `components/`, `lib/`, `app/`
- [x] Create placeholder files to establish patterns

### 0.5 Supabase Setup
- [x] Create Supabase project (user does this manually)
- [x] Add Supabase credentials to `.env.local`
- [x] Install `@supabase/supabase-js`
- [x] Create Supabase client utility (`lib/supabase.ts`)
- [x] **Test**: Log connection status to console

### 0.6 Database Schema - Settings
- [x] Create `settings` table in Supabase (key, value)
- [x] **Test**: Insert and read a test row via Supabase dashboard

### 0.7 Database Schema - Collections
- [x] Create `collections` table (id, name, color, icon, created_at, updated_at)
- [x] **Test**: Insert a test collection via dashboard

### 0.8 Database Schema - Places
- [x] Create `places` table (id, collection_id, name, address, lat, lng, google_maps_url, rating, opening_hours, website, phone, notes, created_at, updated_at, deleted_at)
- [x] Add foreign key to collections
- [x] **Test**: Insert a test place via dashboard

### 0.9 Database Schema - Tags
- [x] Create `tags` table (id, name)
- [x] Create `place_tags` junction table (place_id, tag_id)
- [x] **Test**: Insert test tags and link to a place

---

## Phase 1: Map Foundation

### 1.1 Mapbox Setup
- [x] Get Mapbox API key (user has account)
- [x] Add key to `.env.local`
- [x] Install `mapbox-gl` and `react-map-gl`
- [x] **Test**: Verify packages installed

### 1.2 Basic Map Component
- [x] Create `components/Map.tsx`
- [x] Render a basic Mapbox map
- [x] Set initial view to London (51.5074, -0.1278)
- [x] **Test**: See map centered on London

### 1.3 Map Styling
- [x] Choose a clean Mapbox style (light/minimal)
- [x] Make map fill the viewport
- [x] **Test**: Map looks good, fills screen

### 1.4 Responsive Layout Shell
- [x] Create basic app layout component
- [x] Mobile: map fills screen
- [x] Desktop: map with space for future side panel
- [x] **Test**: Resize browser, layout adapts

### 1.5 Empty State Overlay
- [x] Create overlay component for empty state
- [x] Display "Paste a Google Maps link to get started"
- [x] Style: centered, readable, doesn't block map interaction
- [x] **Test**: Overlay visible on empty app

---

## Phase 2: Password Protection

### 2.1 Password Setup Screen
- [x] Create `/setup` page
- [x] Form: password input, confirm password, submit button
- [x] Basic validation (passwords match, minimum length)
- [x] **Test**: Form renders and validates

### 2.2 Password Hashing
- [x] Install bcrypt (or use Web Crypto API)
- [x] Create utility function to hash password
- [x] **Test**: Hash a test password, verify output

### 2.3 Store Password Hash
- [x] On setup submit, hash password
- [x] Save hash to `settings` table (key: 'password_hash')
- [x] **Test**: Check Supabase dashboard for stored hash

### 2.4 Password Entry Screen
- [x] Create `/login` page
- [x] Form: password input, submit button
- [x] **Test**: Form renders

### 2.5 Password Verification
- [x] Fetch stored hash from `settings`
- [x] Compare entered password with hash
- [x] Show error on mismatch
- [x] **Test**: Wrong password shows error, correct password passes

### 2.6 Session Token
- [x] On successful login, generate session token
- [x] Store token in localStorage
- [x] **Test**: Token appears in localStorage after login

### 2.7 Auth State Check
- [x] Create auth check utility
- [x] Check if valid session exists
- [x] **Test**: Function returns true/false correctly

### 2.8 Route Protection
- [x] Create auth middleware/wrapper
- [x] Redirect to `/login` if not authenticated
- [x] Redirect to `/setup` if no password set yet
- [x] **Test**: Cannot access main app without login

### 2.9 Logout
- [x] Add logout button (in a corner/menu for now)
- [x] Clear session token on logout
- [x] Redirect to login
- [x] **Test**: Logout clears session, requires re-login

---

## Phase 3: Collections (Basic)

### 3.1 Color Palette
- [x] Define 12-16 preset colors as constants
- [x] Create color picker component (grid of color swatches)
- [x] **Test**: Color picker renders, selection works

### 3.2 Icon Set Curation
- [x] Install `lucide-react`
- [x] Curate ~50-80 place-related icons (list of icon names)
- [x] **Test**: Can import and render selected icons

### 3.3 Icon Picker Component
- [x] Create icon picker (grid of icons)
- [x] Scrollable if many icons
- [x] Selection state
- [x] **Test**: Icon picker renders, selection works

### 3.4 Create Collection - UI
- [x] Create "New Collection" modal/dialog
- [x] Form: name input, color picker, icon picker
- [x] Submit button
- [x] **Test**: Modal opens, form works (no save yet)

### 3.5 Create Collection - Save
- [x] On submit, insert into `collections` table
- [x] Close modal on success
- [x] **Test**: New collection appears in Supabase dashboard

### 3.6 Fetch Collections
- [x] Create function to fetch all collections
- [x] **Test**: Console log shows collections from database

### 3.7 Display Collections
- [x] Create simple collections list component
- [x] Show name, color swatch, icon for each
- [x] **Test**: Collections visible in UI

### 3.8 Default Collection
- [x] On first place add (later), auto-create "My Places" if no collections exist
- [x] Default color and icon
- [x] (Implementation will connect in Phase 4)

---

## Phase 4: Add Place via Paste

### 4.1 Paste Listener
- [x] Add global paste event listener
- [x] Log pasted text to console
- [x] **Test**: Paste anything, see it in console

### 4.2 Google Maps URL Detection
- [x] Create regex/function to detect Google Maps URLs
- [x] Handle various formats (maps.google.com, goo.gl/maps, etc.)
- [x] **Test**: Paste Maps URL → detected; paste other text → ignored

### 4.3 Extract Coordinates from URL
- [x] Parse coordinates from Google Maps URL
- [x] Handle different URL formats
- [x] **Test**: Extract lat/lng from various Maps URLs

### 4.4 Place Data Extraction - Basic
- [x] Use coordinates to reverse geocode (free service like Nominatim)
- [x] Get: name (if available), address
- [x] **Test**: Paste URL → get basic place info in console

### 4.5 Place Data Extraction - Extended
- [x] Research free methods for rating, hours, website, phone
- [x] Implement what's feasible (may be limited without Google API)
- [x] **Test**: Log all extracted data

### 4.6 Add to Collection Modal - UI
- [x] Create modal that appears after paste detection
- [x] Show extracted place info (name, address)
- [x] Dropdown to select collection
- [x] Save and Cancel buttons
- [x] **Test**: Modal appears with place info after paste

### 4.7 Save Place to Database
- [x] On save, insert place into `places` table
- [x] Link to selected collection
- [x] Close modal on success
- [x] **Test**: Place appears in Supabase dashboard

### 4.8 Success Feedback
- [x] Show toast/notification on successful save
- [x] **Test**: See confirmation after saving

### 4.9 Error Handling
- [x] If URL parsing fails, show error message
- [x] Offer "Add manually" option (link to manual entry - built later)
- [x] **Test**: Paste invalid URL → see friendly error

---

## Phase 5: Display Places on Map

### 5.1 Fetch Places
- [x] Create function to fetch all places (exclude deleted)
- [x] Include collection data (for color/icon)
- [x] **Test**: Console log shows places with collection info

### 5.2 Basic Markers
- [x] Render places as default markers on map
- [x] Position at lat/lng coordinates
- [x] **Test**: See markers on map for saved places

### 5.3 Custom Pin Color
- [x] Create custom marker component
- [x] Use collection color for marker
- [x] **Test**: Markers show in collection colors

### 5.4 Pin Icons
- [x] Add collection icon inside/beside marker
- [x] **Test**: Markers show icon

### 5.5 Zoom to Fit All
- [x] Calculate bounds of all places
- [x] Fit map view to show all markers
- [x] Use as default view (instead of London) when places exist
- [x] **Test**: Map zooms to show all saved places

### 5.6 Click Handler
- [x] Add click handler to markers
- [x] Log clicked place ID to console
- [x] **Test**: Click marker → see place ID in console

---

## Phase 6: Place Details Panel

### 6.1 Panel Component - Mobile
- [x] Create slide-up panel component
- [x] Animate from bottom of screen
- [x] Close on swipe down or X button
- [x] **Test**: Panel slides up and down

### 6.2 Panel Component - Desktop
- [x] Create side panel component
- [x] Fixed on right side of map
- [x] Close on X button
- [x] **Test**: Panel appears on right

### 6.3 Responsive Panel
- [x] Use mobile panel on small screens
- [x] Use side panel on large screens
- [x] **Test**: Resize browser, correct panel type shows

### 6.4 Wire Up Panel
- [x] Click marker → open panel with that place's data
- [x] **Test**: Click marker → panel opens with place info

### 6.5 Display Basic Info
- [x] Show: name, address
- [x] **Test**: Name and address visible in panel

### 6.6 Display Extended Info
- [x] Show: rating, hours, website, phone (if available)
- [x] Handle missing data gracefully
- [x] **Test**: Extended info shows when available

### 6.7 Collection Link
- [x] Show collection name
- [x] Make it clickable (action: filter map to that collection - implement later)
- [x] Style as link
- [x] **Test**: Collection name visible, looks clickable

### 6.8 Copy Address Button
- [x] Add "Copy" button next to address
- [x] Copy address to clipboard on click
- [x] Show feedback (toast or button text change)
- [x] **Test**: Click copy → address in clipboard

### 6.9 Navigation Button
- [x] Add "Navigate" button
- [x] Open Google Maps directions in new tab
- [x] **Test**: Click → opens Google Maps with directions

### 6.10 Google Maps Link
- [x] Add "View on Google Maps" link
- [x] Opens original Google Maps URL
- [x] **Test**: Link works

---

## Phase 7: Edit & Delete Places

### 7.1 Edit Modal - UI
- [x] Create edit place modal
- [x] Pre-fill: name, notes
- [x] **Test**: Modal opens with current values

### 7.2 Edit Name & Notes
- [x] Save updated name and notes to database
- [x] Close modal, refresh data
- [x] **Test**: Edit saved, panel shows updated info

### 7.3 Tag Input Component
- [x] Create tag input (type to add, click X to remove)
- [x] Show existing tags as chips
- [x] **Test**: Can add/remove tags in UI

### 7.4 Save Tags
- [x] On save, create new tags if needed
- [x] Update place_tags junction table
- [x] **Test**: Tags saved to database

### 7.5 Display Tags in Panel
- [x] Show tags in place details panel
- [x] Style as clickable chips
- [x] (Click action - filter by tag - implement later)
- [x] **Test**: Tags visible in panel

### 7.6 Change Collection
- [x] Add collection dropdown to edit modal
- [x] Save collection change to database
- [x] **Test**: Move place to different collection

### 7.7 Delete Button
- [x] Add delete button to panel or edit modal
- [x] Confirmation dialog
- [x] **Test**: Delete button shows, confirmation appears

### 7.8 Soft Delete
- [x] On delete, set `deleted_at` timestamp (don't actually delete)
- [x] Exclude deleted places from normal queries
- [x] **Test**: Deleted place disappears from map/list

### 7.9 Trash View - Basic
- [x] Create `/trash` page
- [x] List deleted places
- [x] **Test**: See deleted places in trash

### 7.10 Restore from Trash
- [x] Add restore button to trash items
- [x] Clear `deleted_at` to restore
- [x] **Test**: Restored place reappears on map

### 7.11 Permanent Delete
- [x] Add permanent delete button in trash
- [x] Confirmation dialog
- [x] Actually delete from database
- [x] **Test**: Permanently deleted place gone from trash

---

## Phase 8: Collections Management

### 8.1 Edit Collection - UI
- [x] Add edit button to collection in list
- [x] Open modal with current values (name, color, icon)
- [x] **Test**: Edit modal opens with current values

### 8.2 Save Collection Edits
- [x] Update collection in database
- [x] Refresh UI
- [x] **Test**: Changes reflected in collection list and pins

### 8.3 Delete Collection - UI
- [x] Add delete button
- [x] Confirmation dialog explaining what happens to places
- [x] **Test**: Confirmation appears

### 8.4 Delete Collection - Logic
- [x] Option 1: Move places to default collection
- [x] Option 2: Delete places too
- [x] Implement chosen approach
- [x] **Test**: Collection deleted, places handled correctly

### 8.5 Focus on Collection
- [x] Add "Show on map" action to collection
- [x] Zoom map to fit all places in that collection
- [x] **Test**: Click → map zooms to collection's places

### 8.6 Place Count
- [x] Show number of places next to each collection
- [x] **Test**: Counts accurate

---

## Phase 9: Filtering & Search

### 9.1 Filter by Collection - UI
- [x] Add collection filter dropdown
- [x] **Test**: Dropdown shows all collections

### 9.2 Filter by Collection - Logic
- [x] Filter displayed places by selected collection
- [x] Update map markers
- [x] **Test**: Only selected collection's places visible

### 9.3 Filter by Tag - UI
- [x] Add tag filter dropdown (or multi-select)
- [x] Populate with all used tags
- [x] **Test**: Dropdown shows all tags

### 9.4 Filter by Tag - Logic
- [x] Filter places by selected tag(s)
- [x] AND logic when multiple filters
- [x] **Test**: Filtering works correctly

### 9.5 Clear Filters
- [x] Add "Clear filters" button
- [x] Reset to show all places
- [x] **Test**: Clear restores all places

### 9.6 Wire Up Clickable Collection
- [x] Clicking collection name in place panel → filters by that collection
- [x] **Test**: Click collection → map filtered

### 9.7 Wire Up Clickable Tags
- [x] Clicking tag in place panel → filters by that tag
- [x] **Test**: Click tag → map filtered

### 9.8 Search Bar - UI
- [x] Add search input
- [x] **Test**: Search bar visible

### 9.9 Search - Logic
- [x] Search place names, notes, tags
- [x] Update displayed results
- [x] **Test**: Search finds matching places

---

## Phase 10: List View

### 10.1 View Toggle
- [x] Add map/list toggle button
- [x] Track current view in state
- [x] **Test**: Toggle button works

### 10.2 List View Component
- [x] Create list view layout
- [x] Group places by collection
- [x] **Test**: Places shown in list format

### 10.3 List Item
- [x] Show place name, address, collection color/icon
- [x] **Test**: Items display correctly

### 10.4 Sort by Date
- [x] Add sort dropdown
- [x] Sort by date added (newest/oldest)
- [x] **Test**: Sorting works

### 10.5 Sort Alphabetically
- [x] Add A-Z / Z-A sort options
- [x] **Test**: Alpha sort works

### 10.6 Click to Open Details
- [x] Click list item → open place details panel
- [x] (Or switch to map and highlight)
- [x] **Test**: Click works

---

## Phase 11: Context Menu

### 11.1 Desktop Right-Click Menu
- [x] Add right-click handler to markers
- [x] Show context menu at cursor position
- [x] **Test**: Right-click marker → menu appears

### 11.2 Mobile Long-Press Menu
- [x] Add long-press handler to markers
- [x] Show context menu
- [x] **Test**: Long-press → menu appears

### 11.3 Context Menu Actions
- [x] Add actions: Edit, Move to..., Copy address, Navigate, Delete
- [x] Wire up each action
- [x] **Test**: Each action works

---

## Phase 12: Manual Place Entry

### 12.1 Add Manually Button
- [x] Add "Add place manually" button (in menu or floating)
- [x] **Test**: Button visible

### 12.2 Manual Entry Form
- [x] Create form: name (required), address (required)
- [x] Optional: notes, tags, collection
- [x] **Test**: Form renders

### 12.3 Geocode Address
- [x] Use geocoding service to convert address to coordinates
- [x] **Test**: Address → lat/lng

### 12.4 Save Manual Place
- [x] Save to database
- [x] Show on map
- [x] **Test**: Manually added place appears on map

---

## Phase 13: Duplicate Detection

### 13.1 Check by Coordinates
- [x] Before saving, check for nearby existing place (within ~50m)
- [x] **Test**: Finds duplicate by location

### 13.2 Check by URL
- [x] Check for matching Google Maps URL
- [x] **Test**: Finds duplicate by URL

### 13.3 Warning UI
- [x] Show warning: "This place may already exist in [Collection]"
- [x] Options: "Add anyway" or "Cancel"
- [x] **Test**: Warning appears for duplicates

---

## Phase 14: PWA & Share Sheet

### 14.1 Manifest File
- [x] Create `manifest.json` with app name, theme colors
- [x] Link in `<head>`
- [x] **Test**: Chrome DevTools shows manifest

### 14.2 App Icons
- [x] Create/generate icons in required sizes (192x192, 512x512, etc.)
- [x] Add to manifest
- [x] **Test**: Icons show in manifest

### 14.3 Service Worker
- [x] Set up basic service worker (for installability)
- [x] Register in app
- [x] **Test**: SW registered in DevTools

### 14.4 Install Prompt
- [x] App should be installable
- [x] Add "Install" instructions or prompt
- [x] **Test**: Can install app on Android

### 14.5 Share Target - Config
- [x] Add share_target to manifest
- [x] Configure to receive shared URLs
- [x] **Test**: Manifest shows share target config

### 14.6 Share Target - Handler
- [x] Create handler for received shared links
- [x] Trigger add place flow
- [x] **Test**: Share from Google Maps → Matchbook opens with link

### 14.7 Paste Button (Mobile)
- [x] Add visible paste button on mobile
- [x] On tap, read clipboard and process
- [x] **Test**: Paste button works on mobile

---

## Phase 15: Polish & Edge Cases

### 15.1 Loading States
- [x] Add loading spinners/skeletons for async operations
- [x] **Test**: Loading visible during fetches

### 15.2 Error Messages
- [x] User-friendly error messages for all failures
- [x] **Test**: Errors are clear and helpful

### 15.3 Empty States
- [x] Empty state for: no places, no collections, no search results, empty trash
- [x] **Test**: Each empty state looks good

### 15.4 Soft Limits Warning
- [x] Check data size on load
- [x] Warn if approaching performance limits
- [x] **Test**: Warning appears with lots of data

### 15.5 Responsive Review
- [x] Test all screens on mobile, tablet, desktop
- [x] Fix any layout issues
- [x] **Test**: App looks good at all sizes

### 15.6 Accessibility
- [x] Keyboard navigation works
- [x] Screen reader basics
- [x] **Test**: Can use app with keyboard

---

## Phase 16: Deployment

### 16.1 Vercel Setup
- [x] Connect repo to Vercel
- [x] Configure environment variables
- [x] **Test**: Build succeeds

### 16.2 Production Test
- [x] Test deployed app
- [x] Check all features work
- [x] **Test**: Full user flow works in production

### 16.3 PWA Production Test
- [x] Test PWA install on Android
- [x] Test Share Target
- [x] **Test**: Share from Google Maps works

---

## Phase 17: GPS Location

### 17.1 User Location on Map
- [x] Create useGeolocation hook (permission request, position watching)
- [x] Add user location marker (pulsing blue dot)
- [x] Update Map component to show user location
- [x] Add "My Location" button to fly to user position
- [x] Handle permission denied state gracefully
- [x] **Test**: Location dot appears, button flies to location

### 17.2 Back Button Navigation
- [x] Create useHistoryNavigation hook (History API, pushState/popstate)
- [x] Track panel states: map, collections, collection, place
- [x] Track "opened from" context (map pin vs collection list)
- [x] Collections panel: push/pop history on open/drill/close
- [x] Place panel: push history with source tracking
- [x] Handle back button to navigate through panel states
- [x] Handle page refresh gracefully (clear stale state)
- [x] **Test**: Back button navigates through panels correctly

---

## Future Phases (Post-Launch)

Not in v1 - documented for later.

- Export to JSON (backup) and CSV
- Import from JSON backup
- Full authentication (email/password, multi-user)
- Place thumbnails
- Distance sorting (GPS)
- Custom drag-drop ordering
- Article scraping for places
- Multi-collection places
- PDF/Google Maps list export
- Pin clustering (toggle)
- Keyboard shortcuts
- Read Later for articles
