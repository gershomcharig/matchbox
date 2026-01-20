# Matchbox - Project Context

## Overview
Matchbox is a personal web app for collecting and organizing places to visit. Key differentiators: ease of use (paste Google Maps links to add), deep customization (colored pins, icons), and export capabilities.

## Tech Stack
- **Frontend**: Next.js (React framework) with App Router
- **Database**: Supabase (PostgreSQL with free tier)
- **Hosting**: Vercel (free tier)
- **Maps**: Mapbox (50k free loads/month)
- **PWA**: Progressive Web App for share sheet on Android
- **Place Data**: Free web scraping/geocoding (no Google Places API)

## User Context
- Single user building this for fun and to learn "vibe coding"
- Knows HTML and CSS, learning React/Next.js
- Has accounts on GitHub, Vercel, Netlify, and Mapbox
- Needs to create Supabase account
- Primary device: Android (full PWA/share sheet support)

## Key Architecture Decisions
- **Mobile-first responsive design** with minimal/clean aesthetic
- **No visible branding** - functional UI only
- **PWA for share sheet** - Android users can share from Google Maps directly to Matchbox
- **Simple password protection** (not full auth) - single password, persistent session
- **Online only** - no offline support needed
- **Soft delete** - 30-day trash for deleted places
- **JSON export** serves dual purpose as backup and data export
- **AND logic** for combining multiple filters
- **Free alternatives** to Google APIs for place data extraction
- **No pin clustering** for v1 (future feature)
- **Manual entry option** - can add places by typing address, not just pasting links
- **Duplicate warning** - warn but allow when same place detected

## Database Schema
```sql
-- Collections table
collections (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,  -- hex color from preset palette
  icon TEXT NOT NULL,   -- icon name from library
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

-- Places table
places (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections,
  name TEXT NOT NULL,
  address TEXT,
  lat DECIMAL,
  lng DECIMAL,
  google_maps_url TEXT,
  rating DECIMAL,
  opening_hours JSONB,  -- structured hours data
  website TEXT,
  phone TEXT,
  notes TEXT,           -- plain text
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ  -- soft delete
)

-- Tags table
tags (
  id UUID PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
)

-- Place-tag relationship
place_tags (
  place_id UUID REFERENCES places,
  tag_id UUID REFERENCES tags,
  PRIMARY KEY (place_id, tag_id)
)

-- Settings (password hash, etc)
settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)
```

## UI Components
- Map view with Mapbox and custom colored pins with icons
- Place detail panel (slide-up mobile, side panel desktop)
- Collection list/grid with focus-on-map action
- Place list view with date/alpha sorting
- Global search bar
- Filter dropdowns (collections, tags)
- Collection editor modal (name, color picker, icon picker)
- Place editor modal
- Context menu (right-click/long-press)
- Settings page with logout
- Trash view (30-day recovery)
- Import/Export interface
- Password entry screen
- Empty state with London map + prompt
- Paste button (always visible on mobile)

## Libraries/Dependencies
- next (App Router)
- @supabase/supabase-js
- react-map-gl + mapbox-gl
- lucide-react (icon library, ~50-80 curated icons)
- next-pwa (PWA support)

## Color Palette for Pins
12-16 curated colors that look good on maps (to be defined)

## PWA Configuration
- manifest.json with icons and theme
- Service worker for install capability
- Share Target API for receiving shared links (Android)
- Note: iOS doesn't support Share Target - paste button is fallback

## Error Handling
- Google Maps link parsing failure: show error, offer manual entry
- Network errors: show retry option
- Soft limits warning when data gets large

## Empty State
- Map centered on London, UK coordinates: [51.5074, -0.1278]
- Prompt overlay: "Paste a Google Maps link to get started"

## Conversation Summary
All requirements gathered through extensive Q&A:
1. Tech stack: Next.js + Supabase + Vercel + Mapbox + PWA
2. Single user with simple password protection (persistent session)
3. Mobile-first, minimal design, no visible branding
4. Mapbox for maps (user has account)
5. Export to JSON (backup) and CSV
6. Icon library for pin customization (~50-80 icons, expandable)
7. Preset color palette for pins (~12-16 colors)
8. Extract from Google Maps: name, address, coords, link, rating, hours, website, phone
9. Date and alphabetical sorting
10. Soft limits with warnings on data size
11. PWA with share sheet (Android) + paste button always visible
12. Manual entry option for places (geocode address)
13. AND logic for filters
14. Global search
15. Soft delete with 30-day trash
16. Slide-up panel (mobile) / side panel (desktop) for place details
17. Default view: zoom to show all places (empty: London)
18. Free geocoding alternatives (no Google API)
19. Navigation button and copy address button on each place
20. Default "My Places" collection auto-created
21. Context menu (right-click/long-press) with quick actions
22. Click collection to zoom/fit its places
23. Duplicate warning but allow
24. Error handling with manual entry fallback
25. Plain text notes
26. Clickable collection name in place details → navigates to collection's places on map
27. Clickable tags in place details → filters map view by that tag

## Future Features (documented but not for v1)
- Full authentication (email/password)
- Place thumbnails
- Distance sorting (GPS)
- Custom drag-drop ordering
- Center on user location
- Article scraping for places (immediate extraction)
- Multi-collection places
- PDF/Google Maps list export
- Pin clustering (toggle)
- Keyboard shortcuts
- Read Later for articles

## Setup Required Before Coding
1. Create Supabase project
2. Get Mapbox API key (user has account)
3. Configure Supabase tables per schema above
4. Set up Vercel project linked to GitHub repo
