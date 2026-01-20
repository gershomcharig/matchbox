# Matchbox Development Roadmap

This roadmap sequences the build in small, testable steps. Each step should be completable and verifiable before moving to the next. This supports a "vibe coding" approach where we build incrementally and catch bugs early.

**Approach**: Build small, test often, commit frequently.

---

## Phase 0: Project Setup

### 0.1 Initialize Next.js
- [ ] Create Next.js project with App Router
- [ ] Verify dev server runs (`npm run dev`)
- [ ] **Test**: See default Next.js page at localhost:3000

### 0.2 Tailwind CSS
- [ ] Install and configure Tailwind CSS
- [ ] **Test**: Add a colored div, verify styling works

### 0.3 Environment & Git
- [ ] Create `.env.local.example` listing required variables
- [ ] Verify `.gitignore` excludes `.env.local`, `node_modules`, `.next`
- [ ] **Test**: Commit and push, verify no secrets in repo

### 0.4 Project Structure
- [ ] Create folder structure: `components/`, `lib/`, `app/`
- [ ] Create placeholder files to establish patterns

### 0.5 Supabase Setup
- [ ] Create Supabase project (user does this manually)
- [ ] Add Supabase credentials to `.env.local`
- [ ] Install `@supabase/supabase-js`
- [ ] Create Supabase client utility (`lib/supabase.ts`)
- [ ] **Test**: Log connection status to console

### 0.6 Database Schema - Settings
- [ ] Create `settings` table in Supabase (key, value)
- [ ] **Test**: Insert and read a test row via Supabase dashboard

### 0.7 Database Schema - Collections
- [ ] Create `collections` table (id, name, color, icon, created_at, updated_at)
- [ ] **Test**: Insert a test collection via dashboard

### 0.8 Database Schema - Places
- [ ] Create `places` table (id, collection_id, name, address, lat, lng, google_maps_url, rating, opening_hours, website, phone, notes, created_at, updated_at, deleted_at)
- [ ] Add foreign key to collections
- [ ] **Test**: Insert a test place via dashboard

### 0.9 Database Schema - Tags
- [ ] Create `tags` table (id, name)
- [ ] Create `place_tags` junction table (place_id, tag_id)
- [ ] **Test**: Insert test tags and link to a place

---

## Phase 1: Map Foundation

### 1.1 Mapbox Setup
- [ ] Get Mapbox API key (user has account)
- [ ] Add key to `.env.local`
- [ ] Install `mapbox-gl` and `react-map-gl`
- [ ] **Test**: Verify packages installed

### 1.2 Basic Map Component
- [ ] Create `components/Map.tsx`
- [ ] Render a basic Mapbox map
- [ ] Set initial view to London (51.5074, -0.1278)
- [ ] **Test**: See map centered on London

### 1.3 Map Styling
- [ ] Choose a clean Mapbox style (light/minimal)
- [ ] Make map fill the viewport
- [ ] **Test**: Map looks good, fills screen

### 1.4 Responsive Layout Shell
- [ ] Create basic app layout component
- [ ] Mobile: map fills screen
- [ ] Desktop: map with space for future side panel
- [ ] **Test**: Resize browser, layout adapts

### 1.5 Empty State Overlay
- [ ] Create overlay component for empty state
- [ ] Display "Paste a Google Maps link to get started"
- [ ] Style: centered, readable, doesn't block map interaction
- [ ] **Test**: Overlay visible on empty app

---

## Phase 2: Password Protection

### 2.1 Password Setup Screen
- [ ] Create `/setup` page
- [ ] Form: password input, confirm password, submit button
- [ ] Basic validation (passwords match, minimum length)
- [ ] **Test**: Form renders and validates

### 2.2 Password Hashing
- [ ] Install bcrypt (or use Web Crypto API)
- [ ] Create utility function to hash password
- [ ] **Test**: Hash a test password, verify output

### 2.3 Store Password Hash
- [ ] On setup submit, hash password
- [ ] Save hash to `settings` table (key: 'password_hash')
- [ ] **Test**: Check Supabase dashboard for stored hash

### 2.4 Password Entry Screen
- [ ] Create `/login` page
- [ ] Form: password input, submit button
- [ ] **Test**: Form renders

### 2.5 Password Verification
- [ ] Fetch stored hash from `settings`
- [ ] Compare entered password with hash
- [ ] Show error on mismatch
- [ ] **Test**: Wrong password shows error, correct password passes

### 2.6 Session Token
- [ ] On successful login, generate session token
- [ ] Store token in localStorage
- [ ] **Test**: Token appears in localStorage after login

### 2.7 Auth State Check
- [ ] Create auth check utility
- [ ] Check if valid session exists
- [ ] **Test**: Function returns true/false correctly

### 2.8 Route Protection
- [ ] Create auth middleware/wrapper
- [ ] Redirect to `/login` if not authenticated
- [ ] Redirect to `/setup` if no password set yet
- [ ] **Test**: Cannot access main app without login

### 2.9 Logout
- [ ] Add logout button (in a corner/menu for now)
- [ ] Clear session token on logout
- [ ] Redirect to login
- [ ] **Test**: Logout clears session, requires re-login

---

## Phase 3: Collections (Basic)

### 3.1 Color Palette
- [ ] Define 12-16 preset colors as constants
- [ ] Create color picker component (grid of color swatches)
- [ ] **Test**: Color picker renders, selection works

### 3.2 Icon Set Curation
- [ ] Install `lucide-react`
- [ ] Curate ~50-80 place-related icons (list of icon names)
- [ ] **Test**: Can import and render selected icons

### 3.3 Icon Picker Component
- [ ] Create icon picker (grid of icons)
- [ ] Scrollable if many icons
- [ ] Selection state
- [ ] **Test**: Icon picker renders, selection works

### 3.4 Create Collection - UI
- [ ] Create "New Collection" modal/dialog
- [ ] Form: name input, color picker, icon picker
- [ ] Submit button
- [ ] **Test**: Modal opens, form works (no save yet)

### 3.5 Create Collection - Save
- [ ] On submit, insert into `collections` table
- [ ] Close modal on success
- [ ] **Test**: New collection appears in Supabase dashboard

### 3.6 Fetch Collections
- [ ] Create function to fetch all collections
- [ ] **Test**: Console log shows collections from database

### 3.7 Display Collections
- [ ] Create simple collections list component
- [ ] Show name, color swatch, icon for each
- [ ] **Test**: Collections visible in UI

### 3.8 Default Collection
- [ ] On first place add (later), auto-create "My Places" if no collections exist
- [ ] Default color and icon
- [ ] (Implementation will connect in Phase 4)

---

## Phase 4: Add Place via Paste

### 4.1 Paste Listener
- [ ] Add global paste event listener
- [ ] Log pasted text to console
- [ ] **Test**: Paste anything, see it in console

### 4.2 Google Maps URL Detection
- [ ] Create regex/function to detect Google Maps URLs
- [ ] Handle various formats (maps.google.com, goo.gl/maps, etc.)
- [ ] **Test**: Paste Maps URL → detected; paste other text → ignored

### 4.3 Extract Coordinates from URL
- [ ] Parse coordinates from Google Maps URL
- [ ] Handle different URL formats
- [ ] **Test**: Extract lat/lng from various Maps URLs

### 4.4 Place Data Extraction - Basic
- [ ] Use coordinates to reverse geocode (free service like Nominatim)
- [ ] Get: name (if available), address
- [ ] **Test**: Paste URL → get basic place info in console

### 4.5 Place Data Extraction - Extended
- [ ] Research free methods for rating, hours, website, phone
- [ ] Implement what's feasible (may be limited without Google API)
- [ ] **Test**: Log all extracted data

### 4.6 Add to Collection Modal - UI
- [ ] Create modal that appears after paste detection
- [ ] Show extracted place info (name, address)
- [ ] Dropdown to select collection
- [ ] Save and Cancel buttons
- [ ] **Test**: Modal appears with place info after paste

### 4.7 Save Place to Database
- [ ] On save, insert place into `places` table
- [ ] Link to selected collection
- [ ] Close modal on success
- [ ] **Test**: Place appears in Supabase dashboard

### 4.8 Success Feedback
- [ ] Show toast/notification on successful save
- [ ] **Test**: See confirmation after saving

### 4.9 Error Handling
- [ ] If URL parsing fails, show error message
- [ ] Offer "Add manually" option (link to manual entry - built later)
- [ ] **Test**: Paste invalid URL → see friendly error

---

## Phase 5: Display Places on Map

### 5.1 Fetch Places
- [ ] Create function to fetch all places (exclude deleted)
- [ ] Include collection data (for color/icon)
- [ ] **Test**: Console log shows places with collection info

### 5.2 Basic Markers
- [ ] Render places as default markers on map
- [ ] Position at lat/lng coordinates
- [ ] **Test**: See markers on map for saved places

### 5.3 Custom Pin Color
- [ ] Create custom marker component
- [ ] Use collection color for marker
- [ ] **Test**: Markers show in collection colors

### 5.4 Pin Icons
- [ ] Add collection icon inside/beside marker
- [ ] **Test**: Markers show icon

### 5.5 Zoom to Fit All
- [ ] Calculate bounds of all places
- [ ] Fit map view to show all markers
- [ ] Use as default view (instead of London) when places exist
- [ ] **Test**: Map zooms to show all saved places

### 5.6 Click Handler
- [ ] Add click handler to markers
- [ ] Log clicked place ID to console
- [ ] **Test**: Click marker → see place ID in console

---

## Phase 6: Place Details Panel

### 6.1 Panel Component - Mobile
- [ ] Create slide-up panel component
- [ ] Animate from bottom of screen
- [ ] Close on swipe down or X button
- [ ] **Test**: Panel slides up and down

### 6.2 Panel Component - Desktop
- [ ] Create side panel component
- [ ] Fixed on right side of map
- [ ] Close on X button
- [ ] **Test**: Panel appears on right

### 6.3 Responsive Panel
- [ ] Use mobile panel on small screens
- [ ] Use side panel on large screens
- [ ] **Test**: Resize browser, correct panel type shows

### 6.4 Wire Up Panel
- [ ] Click marker → open panel with that place's data
- [ ] **Test**: Click marker → panel opens with place info

### 6.5 Display Basic Info
- [ ] Show: name, address
- [ ] **Test**: Name and address visible in panel

### 6.6 Display Extended Info
- [ ] Show: rating, hours, website, phone (if available)
- [ ] Handle missing data gracefully
- [ ] **Test**: Extended info shows when available

### 6.7 Collection Link
- [ ] Show collection name
- [ ] Make it clickable (action: filter map to that collection - implement later)
- [ ] Style as link
- [ ] **Test**: Collection name visible, looks clickable

### 6.8 Copy Address Button
- [ ] Add "Copy" button next to address
- [ ] Copy address to clipboard on click
- [ ] Show feedback (toast or button text change)
- [ ] **Test**: Click copy → address in clipboard

### 6.9 Navigation Button
- [ ] Add "Navigate" button
- [ ] Open Google Maps directions in new tab
- [ ] **Test**: Click → opens Google Maps with directions

### 6.10 Google Maps Link
- [ ] Add "View on Google Maps" link
- [ ] Opens original Google Maps URL
- [ ] **Test**: Link works

---

## Phase 7: Edit & Delete Places

### 7.1 Edit Modal - UI
- [ ] Create edit place modal
- [ ] Pre-fill: name, notes
- [ ] **Test**: Modal opens with current values

### 7.2 Edit Name & Notes
- [ ] Save updated name and notes to database
- [ ] Close modal, refresh data
- [ ] **Test**: Edit saved, panel shows updated info

### 7.3 Tag Input Component
- [ ] Create tag input (type to add, click X to remove)
- [ ] Show existing tags as chips
- [ ] **Test**: Can add/remove tags in UI

### 7.4 Save Tags
- [ ] On save, create new tags if needed
- [ ] Update place_tags junction table
- [ ] **Test**: Tags saved to database

### 7.5 Display Tags in Panel
- [ ] Show tags in place details panel
- [ ] Style as clickable chips
- [ ] (Click action - filter by tag - implement later)
- [ ] **Test**: Tags visible in panel

### 7.6 Change Collection
- [ ] Add collection dropdown to edit modal
- [ ] Save collection change to database
- [ ] **Test**: Move place to different collection

### 7.7 Delete Button
- [ ] Add delete button to panel or edit modal
- [ ] Confirmation dialog
- [ ] **Test**: Delete button shows, confirmation appears

### 7.8 Soft Delete
- [ ] On delete, set `deleted_at` timestamp (don't actually delete)
- [ ] Exclude deleted places from normal queries
- [ ] **Test**: Deleted place disappears from map/list

### 7.9 Trash View - Basic
- [ ] Create `/trash` page
- [ ] List deleted places
- [ ] **Test**: See deleted places in trash

### 7.10 Restore from Trash
- [ ] Add restore button to trash items
- [ ] Clear `deleted_at` to restore
- [ ] **Test**: Restored place reappears on map

### 7.11 Permanent Delete
- [ ] Add permanent delete button in trash
- [ ] Confirmation dialog
- [ ] Actually delete from database
- [ ] **Test**: Permanently deleted place gone from trash

---

## Phase 8: Collections Management

### 8.1 Edit Collection - UI
- [ ] Add edit button to collection in list
- [ ] Open modal with current values (name, color, icon)
- [ ] **Test**: Edit modal opens with current values

### 8.2 Save Collection Edits
- [ ] Update collection in database
- [ ] Refresh UI
- [ ] **Test**: Changes reflected in collection list and pins

### 8.3 Delete Collection - UI
- [ ] Add delete button
- [ ] Confirmation dialog explaining what happens to places
- [ ] **Test**: Confirmation appears

### 8.4 Delete Collection - Logic
- [ ] Option 1: Move places to default collection
- [ ] Option 2: Delete places too
- [ ] Implement chosen approach
- [ ] **Test**: Collection deleted, places handled correctly

### 8.5 Focus on Collection
- [ ] Add "Show on map" action to collection
- [ ] Zoom map to fit all places in that collection
- [ ] **Test**: Click → map zooms to collection's places

### 8.6 Place Count
- [ ] Show number of places next to each collection
- [ ] **Test**: Counts accurate

---

## Phase 9: Filtering & Search

### 9.1 Filter by Collection - UI
- [ ] Add collection filter dropdown
- [ ] **Test**: Dropdown shows all collections

### 9.2 Filter by Collection - Logic
- [ ] Filter displayed places by selected collection
- [ ] Update map markers
- [ ] **Test**: Only selected collection's places visible

### 9.3 Filter by Tag - UI
- [ ] Add tag filter dropdown (or multi-select)
- [ ] Populate with all used tags
- [ ] **Test**: Dropdown shows all tags

### 9.4 Filter by Tag - Logic
- [ ] Filter places by selected tag(s)
- [ ] AND logic when multiple filters
- [ ] **Test**: Filtering works correctly

### 9.5 Clear Filters
- [ ] Add "Clear filters" button
- [ ] Reset to show all places
- [ ] **Test**: Clear restores all places

### 9.6 Wire Up Clickable Collection
- [ ] Clicking collection name in place panel → filters by that collection
- [ ] **Test**: Click collection → map filtered

### 9.7 Wire Up Clickable Tags
- [ ] Clicking tag in place panel → filters by that tag
- [ ] **Test**: Click tag → map filtered

### 9.8 Search Bar - UI
- [ ] Add search input
- [ ] **Test**: Search bar visible

### 9.9 Search - Logic
- [ ] Search place names, notes, tags
- [ ] Update displayed results
- [ ] **Test**: Search finds matching places

---

## Phase 10: List View

### 10.1 View Toggle
- [ ] Add map/list toggle button
- [ ] Track current view in state
- [ ] **Test**: Toggle button works

### 10.2 List View Component
- [ ] Create list view layout
- [ ] Group places by collection
- [ ] **Test**: Places shown in list format

### 10.3 List Item
- [ ] Show place name, address, collection color/icon
- [ ] **Test**: Items display correctly

### 10.4 Sort by Date
- [ ] Add sort dropdown
- [ ] Sort by date added (newest/oldest)
- [ ] **Test**: Sorting works

### 10.5 Sort Alphabetically
- [ ] Add A-Z / Z-A sort options
- [ ] **Test**: Alpha sort works

### 10.6 Click to Open Details
- [ ] Click list item → open place details panel
- [ ] (Or switch to map and highlight)
- [ ] **Test**: Click works

---

## Phase 11: Context Menu

### 11.1 Desktop Right-Click Menu
- [ ] Add right-click handler to markers
- [ ] Show context menu at cursor position
- [ ] **Test**: Right-click marker → menu appears

### 11.2 Mobile Long-Press Menu
- [ ] Add long-press handler to markers
- [ ] Show context menu
- [ ] **Test**: Long-press → menu appears

### 11.3 Context Menu Actions
- [ ] Add actions: Edit, Move to..., Copy address, Navigate, Delete
- [ ] Wire up each action
- [ ] **Test**: Each action works

---

## Phase 12: Manual Place Entry

### 12.1 Add Manually Button
- [ ] Add "Add place manually" button (in menu or floating)
- [ ] **Test**: Button visible

### 12.2 Manual Entry Form
- [ ] Create form: name (required), address (required)
- [ ] Optional: notes, tags, collection
- [ ] **Test**: Form renders

### 12.3 Geocode Address
- [ ] Use geocoding service to convert address to coordinates
- [ ] **Test**: Address → lat/lng

### 12.4 Save Manual Place
- [ ] Save to database
- [ ] Show on map
- [ ] **Test**: Manually added place appears on map

---

## Phase 13: Duplicate Detection

### 13.1 Check by Coordinates
- [ ] Before saving, check for nearby existing place (within ~50m)
- [ ] **Test**: Finds duplicate by location

### 13.2 Check by URL
- [ ] Check for matching Google Maps URL
- [ ] **Test**: Finds duplicate by URL

### 13.3 Warning UI
- [ ] Show warning: "This place may already exist in [Collection]"
- [ ] Options: "Add anyway" or "Cancel"
- [ ] **Test**: Warning appears for duplicates

---

## Phase 14: Export & Import

### 14.1 Export JSON
- [ ] Add export button in settings/menu
- [ ] Gather all data (places, collections, tags)
- [ ] Download as JSON file
- [ ] **Test**: File downloads with correct data

### 14.2 Export CSV
- [ ] Add CSV export option
- [ ] Flatten data for spreadsheet format
- [ ] **Test**: CSV opens correctly in Excel/Sheets

### 14.3 Import JSON - UI
- [ ] Add import option
- [ ] File picker for JSON
- [ ] **Test**: Can select file

### 14.4 Import JSON - Validation
- [ ] Parse and validate JSON structure
- [ ] Show preview of what will be imported
- [ ] **Test**: Invalid JSON shows error

### 14.5 Import JSON - Save
- [ ] Import collections, places, tags
- [ ] Handle potential conflicts
- [ ] **Test**: Imported data appears in app

---

## Phase 15: PWA & Share Sheet

### 15.1 Manifest File
- [ ] Create `manifest.json` with app name, theme colors
- [ ] Link in `<head>`
- [ ] **Test**: Chrome DevTools shows manifest

### 15.2 App Icons
- [ ] Create/generate icons in required sizes (192x192, 512x512, etc.)
- [ ] Add to manifest
- [ ] **Test**: Icons show in manifest

### 15.3 Service Worker
- [ ] Set up basic service worker (for installability)
- [ ] Register in app
- [ ] **Test**: SW registered in DevTools

### 15.4 Install Prompt
- [ ] App should be installable
- [ ] Add "Install" instructions or prompt
- [ ] **Test**: Can install app on Android

### 15.5 Share Target - Config
- [ ] Add share_target to manifest
- [ ] Configure to receive shared URLs
- [ ] **Test**: Manifest shows share target config

### 15.6 Share Target - Handler
- [ ] Create handler for received shared links
- [ ] Trigger add place flow
- [ ] **Test**: Share from Google Maps → Matchbox opens with link

### 15.7 Paste Button (Mobile)
- [ ] Add visible paste button on mobile
- [ ] On tap, read clipboard and process
- [ ] **Test**: Paste button works on mobile

---

## Phase 16: Polish & Edge Cases

### 16.1 Loading States
- [ ] Add loading spinners/skeletons for async operations
- [ ] **Test**: Loading visible during fetches

### 16.2 Error Messages
- [ ] User-friendly error messages for all failures
- [ ] **Test**: Errors are clear and helpful

### 16.3 Empty States
- [ ] Empty state for: no places, no collections, no search results, empty trash
- [ ] **Test**: Each empty state looks good

### 16.4 Soft Limits Warning
- [ ] Check data size on load
- [ ] Warn if approaching performance limits
- [ ] **Test**: Warning appears with lots of data

### 16.5 Responsive Review
- [ ] Test all screens on mobile, tablet, desktop
- [ ] Fix any layout issues
- [ ] **Test**: App looks good at all sizes

### 16.6 Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader basics
- [ ] **Test**: Can use app with keyboard

---

## Phase 17: Deployment

### 17.1 Vercel Setup
- [ ] Connect repo to Vercel
- [ ] Configure environment variables
- [ ] **Test**: Build succeeds

### 17.2 Production Test
- [ ] Test deployed app
- [ ] Check all features work
- [ ] **Test**: Full user flow works in production

### 17.3 PWA Production Test
- [ ] Test PWA install on Android
- [ ] Test Share Target
- [ ] **Test**: Share from Google Maps works

---

## Future Phases (Post-Launch)

Not in v1 - documented for later.

- Full authentication (email/password, multi-user)
- Place thumbnails
- Distance sorting (GPS)
- Custom drag-drop ordering
- Center on user location
- Article scraping for places
- Multi-collection places
- PDF/Google Maps list export
- Pin clustering (toggle)
- Keyboard shortcuts
- Read Later for articles
