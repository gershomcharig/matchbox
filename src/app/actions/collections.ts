'use server';

import { supabase } from '@/lib/supabase';

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
