'use server';

import { supabase } from '@/lib/supabase';
import { getOrCreateDefaultCollection } from './collections';

export interface Place {
  id: string;
  collection_id: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  google_maps_url: string | null;
  rating: number | null;
  opening_hours: Record<string, unknown> | null;
  website: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  user_ratings_total: number | null;
  types: string[] | null;
}

export interface CreatePlaceInput {
  name: string;
  address?: string;
  lat?: number;
  lng?: number;
  googleMapsUrl?: string;
  collectionId?: string;
  rating?: number;
  website?: string;
  phone?: string;
  notes?: string;
  openingHours?: string[];
  userRatingsTotal?: number;
  types?: string[];
}

export interface CreatePlaceResult {
  success: boolean;
  place?: Place;
  error?: string;
}

/**
 * Create a new place in the database
 */
export async function createPlace(input: CreatePlaceInput): Promise<CreatePlaceResult> {
  const {
    name,
    address,
    lat,
    lng,
    googleMapsUrl,
    collectionId,
    rating,
    website,
    phone,
    notes,
    openingHours,
    userRatingsTotal,
    types,
  } = input;

  // Validate input
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Place name is required' };
  }

  try {
    // Get or create default collection if none specified
    let finalCollectionId = collectionId;

    if (!finalCollectionId) {
      const defaultResult = await getOrCreateDefaultCollection();
      if (!defaultResult.success || !defaultResult.collection) {
        return { success: false, error: 'Failed to get default collection' };
      }
      finalCollectionId = defaultResult.collection.id;
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('places')
      .insert({
        name: name.trim(),
        address: address || null,
        lat: lat || null,
        lng: lng || null,
        google_maps_url: googleMapsUrl || null,
        collection_id: finalCollectionId,
        rating: rating || null,
        opening_hours: openingHours ? { weekdays: openingHours } : null,
        website: website || null,
        phone: phone || null,
        notes: notes || null,
        user_ratings_total: userRatingsTotal || null,
        types: types || null,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating place:', error);
      return { success: false, error: 'Failed to create place' };
    }

    return { success: true, place: data as Place };
  } catch (err) {
    console.error('Error creating place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch all places from the database (excluding soft-deleted)
 */
export async function getPlaces(): Promise<{
  success: boolean;
  places?: Place[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as Place[] };
  } catch (err) {
    console.error('Error fetching places:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Place with collection data included (for map display)
 */
export interface PlaceWithCollection extends Place {
  collection: {
    id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

/**
 * Fetch all places with their collection data (for map markers)
 * Excludes soft-deleted places
 */
export async function getPlacesWithCollections(): Promise<{
  success: boolean;
  places?: PlaceWithCollection[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        collection:collections(id, name, color, icon)
      `)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places with collections:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as PlaceWithCollection[] };
  } catch (err) {
    console.error('Error fetching places with collections:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch places for a specific collection
 */
export async function getPlacesByCollection(collectionId: string): Promise<{
  success: boolean;
  places?: Place[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('collection_id', collectionId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching places:', error);
      return { success: false, error: 'Failed to fetch places' };
    }

    return { success: true, places: data as Place[] };
  } catch (err) {
    console.error('Error fetching places:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update a place's editable fields
 */
export interface UpdatePlaceInput {
  id: string;
  name?: string;
  notes?: string;
  collectionId?: string;
}

export async function updatePlace(input: UpdatePlaceInput): Promise<{
  success: boolean;
  place?: Place;
  error?: string;
}> {
  const { id, name, notes, collectionId } = input;

  if (!id) {
    return { success: false, error: 'Place ID is required' };
  }

  try {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      if (!name.trim()) {
        return { success: false, error: 'Place name cannot be empty' };
      }
      updates.name = name.trim();
    }

    if (notes !== undefined) {
      updates.notes = notes || null;
    }

    if (collectionId !== undefined) {
      updates.collection_id = collectionId;
    }

    const { data, error } = await supabase
      .from('places')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating place:', error);
      return { success: false, error: 'Failed to update place' };
    }

    return { success: true, place: data as Place };
  } catch (err) {
    console.error('Error updating place:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ============ Tag Related Functions ============

export interface Tag {
  id: string;
  name: string;
}

/**
 * Get all tags
 */
export async function getTags(): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Supabase error fetching tags:', error);
      return { success: false, error: 'Failed to fetch tags' };
    }

    return { success: true, tags: data as Tag[] };
  } catch (err) {
    console.error('Error fetching tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get tags for a specific place
 */
export async function getTagsForPlace(placeId: string): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('place_tags')
      .select('tag_id, tags(id, name)')
      .eq('place_id', placeId);

    if (error) {
      console.error('Supabase error fetching place tags:', error);
      return { success: false, error: 'Failed to fetch place tags' };
    }

    const tags = data
      .map((pt) => pt.tags as unknown as Tag)
      .filter((t): t is Tag => t !== null);

    return { success: true, tags };
  } catch (err) {
    console.error('Error fetching place tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Create a tag if it doesn't exist, return existing if it does
 */
export async function getOrCreateTag(name: string): Promise<{
  success: boolean;
  tag?: Tag;
  error?: string;
}> {
  const trimmedName = name.trim().toLowerCase();

  if (!trimmedName) {
    return { success: false, error: 'Tag name is required' };
  }

  try {
    // Check if tag exists
    const { data: existing, error: fetchError } = await supabase
      .from('tags')
      .select('*')
      .ilike('name', trimmedName)
      .single();

    if (existing && !fetchError) {
      return { success: true, tag: existing as Tag };
    }

    // Create new tag
    const { data: newTag, error: createError } = await supabase
      .from('tags')
      .insert({ name: trimmedName })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error creating tag:', createError);
      return { success: false, error: 'Failed to create tag' };
    }

    return { success: true, tag: newTag as Tag };
  } catch (err) {
    console.error('Error in getOrCreateTag:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Update tags for a place
 */
export async function updatePlaceTags(
  placeId: string,
  tagNames: string[]
): Promise<{
  success: boolean;
  tags?: Tag[];
  error?: string;
}> {
  try {
    // Delete existing place_tags
    const { error: deleteError } = await supabase
      .from('place_tags')
      .delete()
      .eq('place_id', placeId);

    if (deleteError) {
      console.error('Supabase error deleting place tags:', deleteError);
      return { success: false, error: 'Failed to update tags' };
    }

    if (tagNames.length === 0) {
      return { success: true, tags: [] };
    }

    // Get or create all tags
    const tags: Tag[] = [];
    for (const name of tagNames) {
      const result = await getOrCreateTag(name);
      if (result.success && result.tag) {
        tags.push(result.tag);
      }
    }

    // Insert new place_tags
    const placeTags = tags.map((tag) => ({
      place_id: placeId,
      tag_id: tag.id,
    }));

    const { error: insertError } = await supabase
      .from('place_tags')
      .insert(placeTags);

    if (insertError) {
      console.error('Supabase error inserting place tags:', insertError);
      return { success: false, error: 'Failed to update tags' };
    }

    return { success: true, tags };
  } catch (err) {
    console.error('Error updating place tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Place with collection and tags data
 */
export interface PlaceWithCollectionAndTags extends PlaceWithCollection {
  tags: Tag[];
}

// ============ Duplicate Detection Functions ============

/**
 * Result of a duplicate check
 */
export interface DuplicateCheckResult {
  success: boolean;
  isDuplicate: boolean;
  existingPlace?: PlaceWithCollection;
  matchType?: 'coordinates' | 'url';
  error?: string;
}

/**
 * Calculate distance between two coordinates in meters using Haversine formula
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check for duplicate place by coordinates (within ~50m)
 */
export async function checkDuplicateByCoordinates(
  lat: number,
  lng: number,
  thresholdMeters: number = 50
): Promise<DuplicateCheckResult> {
  try {
    // Get all non-deleted places with coordinates
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        collection:collections(id, name, color, icon)
      `)
      .is('deleted_at', null)
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (error) {
      console.error('Supabase error checking duplicates:', error);
      return { success: false, isDuplicate: false, error: 'Failed to check for duplicates' };
    }

    // Find any place within the threshold distance
    for (const place of data as PlaceWithCollection[]) {
      if (place.lat !== null && place.lng !== null) {
        const distance = calculateDistance(lat, lng, place.lat, place.lng);
        if (distance <= thresholdMeters) {
          return {
            success: true,
            isDuplicate: true,
            existingPlace: place,
            matchType: 'coordinates',
          };
        }
      }
    }

    return { success: true, isDuplicate: false };
  } catch (err) {
    console.error('Error checking duplicate by coordinates:', err);
    return { success: false, isDuplicate: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check for duplicate place by Google Maps URL
 */
export async function checkDuplicateByUrl(
  googleMapsUrl: string
): Promise<DuplicateCheckResult> {
  if (!googleMapsUrl) {
    return { success: true, isDuplicate: false };
  }

  try {
    // Look for exact URL match
    const { data, error } = await supabase
      .from('places')
      .select(`
        *,
        collection:collections(id, name, color, icon)
      `)
      .eq('google_maps_url', googleMapsUrl)
      .is('deleted_at', null)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - not an error for our purposes
      console.error('Supabase error checking URL duplicates:', error);
      return { success: false, isDuplicate: false, error: 'Failed to check for duplicates' };
    }

    if (data) {
      return {
        success: true,
        isDuplicate: true,
        existingPlace: data as PlaceWithCollection,
        matchType: 'url',
      };
    }

    return { success: true, isDuplicate: false };
  } catch (err) {
    console.error('Error checking duplicate by URL:', err);
    return { success: false, isDuplicate: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Check for duplicates by both coordinates and URL
 */
export async function checkForDuplicates(
  lat: number | null,
  lng: number | null,
  googleMapsUrl: string | null
): Promise<DuplicateCheckResult> {
  // First check by URL (exact match is more reliable)
  if (googleMapsUrl) {
    const urlResult = await checkDuplicateByUrl(googleMapsUrl);
    if (!urlResult.success || urlResult.isDuplicate) {
      return urlResult;
    }
  }

  // Then check by coordinates
  if (lat !== null && lng !== null) {
    const coordResult = await checkDuplicateByCoordinates(lat, lng);
    return coordResult;
  }

  return { success: true, isDuplicate: false };
}

/**
 * Fetch all places with their collection and tags data
 */
export async function getPlacesWithCollectionsAndTags(): Promise<{
  success: boolean;
  places?: PlaceWithCollectionAndTags[];
  error?: string;
}> {
  try {
    // First get places with collections
    const placesResult = await getPlacesWithCollections();
    if (!placesResult.success || !placesResult.places) {
      return { success: false, error: placesResult.error };
    }

    // Then get tags for each place
    const placesWithTags: PlaceWithCollectionAndTags[] = await Promise.all(
      placesResult.places.map(async (place) => {
        const tagsResult = await getTagsForPlace(place.id);
        return {
          ...place,
          tags: tagsResult.success && tagsResult.tags ? tagsResult.tags : [],
        };
      })
    );

    return { success: true, places: placesWithTags };
  } catch (err) {
    console.error('Error fetching places with tags:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
