'use server';

import { createClient } from '@/lib/supabase/server';
import { ProjectStage, ProjectCategory } from '@/types/database';

export interface SearchProjectResult {
  id: string;
  client_name: string;
  phone: string;
  address: string;
  stage: ProjectStage;
  category: ProjectCategory;
  kw_required: number;
  quotation_amount: number | null;
}

export async function searchProjectsAction(query: string): Promise<{
  results: SearchProjectResult[];
  error?: string;
}> {
  try {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      return { results: [] };
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { results: [], error: 'Unauthorized' };
    }

    // RLS automatically scopes this query based on user's role (Business Rule 2 / 3)
    const { data, error } = await supabase
      .from('projects')
      .select('id, client_name, phone, address, stage, category, kw_required, quotation_amount')
      .or(`client_name.ilike.%${trimmed}%,phone.ilike.%${trimmed}%,address.ilike.%${trimmed}%`)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      return { results: [], error: error.message };
    }

    return { results: (data as SearchProjectResult[]) || [] };
  } catch (err: any) {
    return { results: [], error: err.message || 'Search failed' };
  }
}
