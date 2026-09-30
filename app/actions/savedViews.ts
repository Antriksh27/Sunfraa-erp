'use server';

import { createClient } from '@/lib/supabase/server';
import { SavedView } from '@/types/database';

export async function getSavedViewsAction(moduleName: string): Promise<{ data?: SavedView[]; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized. Please sign in.' };
    }

    const { data, error } = await supabase
      .from('saved_views')
      .select('*')
      .eq('user_id', user.id)
      .eq('module_name', moduleName)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { data: (data as SavedView[]) || [] };
  } catch (err: any) {
    return { error: err.message || 'Failed to fetch saved views' };
  }
}

export async function saveViewAction(
  moduleName: string,
  viewName: string,
  filterJson: Record<string, any>
): Promise<{ data?: SavedView; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized. Please sign in.' };
    }

    const trimmedName = viewName.trim();
    if (!trimmedName) {
      return { error: 'View name cannot be empty.' };
    }

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('saved_views')
      .upsert(
        {
          user_id: user.id,
          module_name: moduleName,
          view_name: trimmedName,
          filter_json: filterJson,
          updated_at: now,
        },
        { onConflict: 'user_id,module_name,view_name' }
      )
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data: data as SavedView };
  } catch (err: any) {
    return { error: err.message || 'Failed to save view' };
  }
}

export async function deleteSavedViewAction(viewId: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'Unauthorized. Please sign in.' };
    }

    const { error } = await supabase
      .from('saved_views')
      .delete()
      .eq('id', viewId)
      .eq('user_id', user.id);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { error: err.message || 'Failed to delete view' };
  }
}
