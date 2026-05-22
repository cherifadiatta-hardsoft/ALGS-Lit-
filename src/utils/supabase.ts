import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://gzpluplflqciwscecyrs.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Initialize client, but allow fallback if key is missing to avoid crashing the app
export const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Interface representing a shared location row in Supabase
 */
export interface ShareLocation {
  id: string; // uuid
  created_at: string;
  type: 'client' | 'driver';
  sender_phone: string;
  recipient_phone: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  status: 'pending' | 'delivered' | 'canceled';
  note?: string;
}

/**
 * Creates a public tracking share record in Supabase
 */
export async function createShareRecord(data: {
  type: 'client' | 'driver';
  sender_phone: string;
  recipient_phone: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  note?: string;
}): Promise<string | null> {
  if (!supabase) {
    console.warn('Supabase is not initialized. Check your VITE_SUPABASE_ANON_KEY.');
    return null;
  }

  try {
    const { data: insertResult, error } = await supabase
      .from('shares')
      .insert([
        {
          type: data.type,
          sender_phone: data.sender_phone,
          recipient_phone: data.recipient_phone,
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          status: 'pending',
          note: data.note || ''
        }
      ])
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting share into Supabase:', error);
      return null;
    }

    return insertResult?.id || null;
  } catch (err) {
    console.error('Failed to create share record:', err);
    return null;
  }
}

/**
 * Retrieves a share record from Supabase by UUID
 */
export async function getShareRecord(id: string): Promise<ShareLocation | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('shares')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching share from Supabase:', error);
      return null;
    }

    return data as ShareLocation;
  } catch (err) {
    console.error('Failed to get share record:', err);
    return null;
  }
}

/**
 * Subscribes to real-time updates for a share record
 */
export function subscribeToShareUpdates(id: string, callback: (payload: ShareLocation) => void) {
  if (!supabase) return () => {};

  const channel = supabase
    .channel(`share-updates-${id}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'shares',
        filter: `id=eq.${id}`
      },
      (payload) => {
        callback(payload.new as ShareLocation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Updates coordinates of an existing share
 */
export async function updateShareCoordinates(id: string, latitude: number, longitude: number, accuracy: number): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('shares')
      .update({
        latitude,
        longitude,
        accuracy,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating coordinates:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update share coordinates:', err);
    return false;
  }
}

/**
 * Updates the status of a share
 */
export async function updateShareStatus(id: string, status: 'pending' | 'delivered' | 'canceled'): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('shares')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Failed to update status:', err);
    return false;
  }
}
