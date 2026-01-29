'use server';

import { supabase } from '@/lib/supabase';
import { DEFAULT_COLOR } from '@/lib/colors';
import { DEFAULT_EMOJI } from '@/lib/emojis';

/** Default collection name */
const DEFAULT_COLLECTION_NAME = 'My Places';

export interface Collection {
  id: string;
  name: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionInput {
  name: string;
  color: string;
  icon: string;
}

export interface CreateCollectionResult {
  success: boolean;
  collection?: Collection;
  error?: string;
}

/**
 * Create a new collection in the database
 */
export async function createCollection(
  input: CreateCollectionInput
): Promise<CreateCollectionResult> {
  const { name, color, icon } = input;

  // Validate input
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Collection name is required' };
  }

  if (!color) {
    return { success: false, error: 'Collection color is required' };
  }

  if (!icon) {
    return { success: false, error: 'Collection icon is required' };
  }

  try {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: name.trim(),
        color,
        icon,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating collection:', error);
      return { success: false, error: 'Failed to create collection' };
    }

    return { success: true, collection: data as Collection };
  } catch (err) {
    console.error('Error creating collection:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Fetch all collections from the database
 */
export async function getCollections(): Promise<{
  success: boolean;
  collections?: Collection[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching collections:', error);
      return { success: false, error: 'Failed to fetch collections' };
    }

    return { success: true, collections: data as Collection[] };
  } catch (err) {
    console.error('Error fetching collections:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export interface UpdateCollectionInput {
  id: string;
  name: string;
  color: string;
  icon: string;
}

/**
 * Update an existing collection
 */
export async function updateCollection(
  input: UpdateCollectionInput
): Promise<{ success: boolean; collection?: Collection; error?: string }> {
  const { id, name, color, icon } = input;

  if (!id) {
    return { success: false, error: 'Collection ID is required' };
  }

  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Collection name is required' };
  }

  try {
    const { data, error } = await supabase
      .from('collections')
      .update({
        name: name.trim(),
        color,
        icon,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error updating collection:', error);
      return { success: false, error: 'Failed to update collection' };
    }

    return { success: true, collection: data as Collection };
  } catch (err) {
    console.error('Error updating collection:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Delete a collection. Places in the collection are moved to the default collection.
 */
export async function deleteCollection(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!id) {
    return { success: false, error: 'Collection ID is required' };
  }

  try {
    // First, get or create a default collection to move places to
    const defaultResult = await getOrCreateDefaultCollection();

    // If deleting the only collection (which is the default), we need to handle this
    // Check if we're deleting the default collection
    const { data: collections } = await supabase
      .from('collections')
      .select('id')
      .order('created_at', { ascending: true });

    if (collections && collections.length === 1 && collections[0].id === id) {
      return { success: false, error: 'Cannot delete the only collection' };
    }

    // Get a different collection to move places to
    let targetCollectionId: string;

    if (defaultResult.success && defaultResult.collection && defaultResult.collection.id !== id) {
      targetCollectionId = defaultResult.collection.id;
    } else {
      // Find another collection that isn't the one being deleted
      const { data: otherCollection } = await supabase
        .from('collections')
        .select('id')
        .neq('id', id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (!otherCollection) {
        return { success: false, error: 'No collection available to move places to' };
      }
      targetCollectionId = otherCollection.id;
    }

    // Move all places from the deleted collection to the target collection
    const { error: moveError } = await supabase
      .from('places')
      .update({ collection_id: targetCollectionId })
      .eq('collection_id', id);

    if (moveError) {
      console.error('Error moving places:', moveError);
      return { success: false, error: 'Failed to move places to another collection' };
    }

    // Now delete the collection
    const { error: deleteError } = await supabase
      .from('collections')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Supabase error deleting collection:', deleteError);
      return { success: false, error: 'Failed to delete collection' };
    }

    return { success: true };
  } catch (err) {
    console.error('Error deleting collection:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get count of places in each collection
 */
export async function getCollectionPlaceCounts(): Promise<{
  success: boolean;
  counts?: Record<string, number>;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('places')
      .select('collection_id')
      .is('deleted_at', null);

    if (error) {
      console.error('Supabase error fetching place counts:', error);
      return { success: false, error: 'Failed to fetch place counts' };
    }

    // Count places per collection
    const counts: Record<string, number> = {};
    for (const place of data || []) {
      if (place.collection_id) {
        counts[place.collection_id] = (counts[place.collection_id] || 0) + 1;
      }
    }

    return { success: true, counts };
  } catch (err) {
    console.error('Error fetching place counts:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Get the default collection, creating it if it doesn't exist.
 * Used when adding places without explicitly selecting a collection.
 */
export async function getOrCreateDefaultCollection(): Promise<{
  success: boolean;
  collection?: Collection;
  error?: string;
}> {
  try {
    // First, try to find existing collections
    const { data: collections, error: fetchError } = await supabase
      .from('collections')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (fetchError) {
      console.error('Supabase error fetching collections:', fetchError);
      return { success: false, error: 'Failed to fetch collections' };
    }

    // If we have at least one collection, return the first one (oldest)
    if (collections && collections.length > 0) {
      return { success: true, collection: collections[0] as Collection };
    }

    // No collections exist, create the default one
    const now = new Date().toISOString();

    const { data: newCollection, error: createError } = await supabase
      .from('collections')
      .insert({
        name: DEFAULT_COLLECTION_NAME,
        color: DEFAULT_COLOR.value,
        icon: DEFAULT_EMOJI.emoji,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (createError) {
      console.error('Supabase error creating default collection:', createError);
      return { success: false, error: 'Failed to create default collection' };
    }

    return { success: true, collection: newCollection as Collection };
  } catch (err) {
    console.error('Error in getOrCreateDefaultCollection:', err);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
