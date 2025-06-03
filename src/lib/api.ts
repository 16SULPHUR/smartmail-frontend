// src/lib/api.ts
import { supabase } from '@/supabaseClient'; // Ensure this is your configured frontend Supabase client
import { EmailDocument } from '@/types/email';

// This is the response structure fetchEmails will now build
export interface ApiEmailsResponse {
  emails: EmailDocument[];
  total: number;
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  accounts?: string[];
  folders?: string[];
  categories?: string[];
}

export type { ReplyIntent } from '@/types/email'; // Keep if suggestReplies is still used

// This API_BASE_URL might still be used by suggestReplies if that hits an external backend
const API_BASE_URL = 'https://outbox-assignment-kappa.vercel.app/api';

export interface FetchEmailsParams {
  search?: string;
  account?: string;
  folder?: string;
  category?: string;
  page?: number;
  limit?: number;
  // token is no longer needed as Supabase client handles auth
}

export const fetchEmails = async (params: FetchEmailsParams): Promise<ApiEmailsResponse> => {
  if (!supabase) {
    console.error("Supabase client not initialized. Cannot fetch emails.");
    return { emails: [], total: 0, accounts: [], folders: [], categories: [], currentPage: 1, pageSize: 0, totalPages: 0 };
  }

  const page = params.page || 1;
  const limit = params.limit || 15; // Default page size
  const offset = (page - 1) * limit;

  console.log('[SUPABASE_FETCH] Fetching emails with params:', params);

  try {
    // The user_id filter will be handled by RLS if policies are set correctly
    // to auth.uid() = user_id. No need to explicitly add .eq('user_id', session.user.id) here
    // if RLS is doing its job based on the authenticated user making the request.

    let query = supabase
      .from('emails') // Target your main 'emails' table
      .select('*', { count: 'exact' }); // Get all columns and total count

    // Apply filters
    if (params.search) {
      const searchTerm = `%${params.search}%`;
      // Case-insensitive LIKE search on multiple columns.
      // For true full-text search, you'd use .textSearch() and have FTS indexes.
      query = query.or(`subject.ilike.${searchTerm},from_address.ilike.${searchTerm},body_text.ilike.${searchTerm}`);
    }
    if (params.account) {
      query = query.eq('account', params.account);
    }
    if (params.folder) {
      query = query.eq('folder', params.folder);
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // Order and Pagination
    // Assuming you have 'sent_at' or 'created_at' for sorting. 'received_at' is also good.
    query = query.order('sent_at', { ascending: false, nullsFirst: false }); 
    query = query.range(offset, offset + limit - 1);

    const { data: emailData, error: emailError, count } = await query;

    if (emailError) {
      console.error("[SUPABASE_FETCH] Error fetching emails:", emailError);
      throw emailError;
    }

    // Assuming emailData is an array of objects matching EmailDocument or needing minimal transformation
    const emails = (emailData || []).map(dbEmail => ({
        ...dbEmail,
        // Ensure date fields are in the format your EmailDocument/UI expects
        // Supabase returns ISO strings, which are generally fine.
    })) as EmailDocument[];


    // --- Fetch Distinct Values for Filters from the 'emails' table ---
    // These will also be filtered by RLS, so users only see filter options relevant to their data.
    let distinctAccounts: string[] = [];
    let distinctFolders: string[] = [];
    let distinctCategories: string[] = [];

    try {
        // Fetching distinct values can be done in parallel
        // Note: If RLS is very restrictive, these might return limited results.
        // It's usually fine as RLS for SELECT on these columns should also apply.
        const [accountsRes, foldersRes, categoriesRes] = await Promise.all([
            supabase.from('emails').select('account', { count: 'exact' }), // No need to fetch all rows, just distinct values
            supabase.from('emails').select('folder', { count: 'exact' }),
            supabase.from('emails').select('category', { count: 'exact' })
            // For truly distinct values, you might need an RPC or more complex query if Supabase JS client doesn't optimize this.
            // A simple select('column_name').limit(very_large_number) and then Set on client is common for simplicity.
        ]);
        
        // A more efficient way to get distinct values if the above is slow or returns too much data:
        // This would involve creating RPC functions in Supabase.
        // For now, let's process the limited results from simple selects:

        // To get truly distinct values from a potentially large number of rows,
        // an RPC function in Supabase is more efficient:
        // Example RPC function 'get_distinct_email_accounts':
        // CREATE OR REPLACE FUNCTION get_distinct_email_accounts()
        // RETURNS TABLE(account TEXT) AS $$
        // BEGIN
        //   RETURN QUERY SELECT DISTINCT T.account FROM emails T WHERE auth.uid() = T.user_id ORDER BY T.account;
        // END; $$ LANGUAGE plpgsql SECURITY DEFINER;
        // Then call: const { data: accountsData } = await supabase.rpc('get_distinct_email_accounts');

        // Assuming the simple select approach for now:
        if (accountsRes.data) {
            distinctAccounts = [...new Set(accountsRes.data.map(item => item.account).filter(Boolean) as string[])].sort();
        } else if (accountsRes.error) {
            console.warn("[SUPABASE_FETCH] Could not fetch distinct accounts:", accountsRes.error);
        }

        if (foldersRes.data) {
            distinctFolders = [...new Set(foldersRes.data.map(item => item.folder).filter(Boolean) as string[])].sort();
        } else if (foldersRes.error) {
            console.warn("[SUPABASE_FETCH] Could not fetch distinct folders:", foldersRes.error);
        }

        if (categoriesRes.data) {
            distinctCategories = [...new Set(categoriesRes.data.map(item => item.category).filter(Boolean) as string[])].sort();
        } else if (categoriesRes.error) {
            console.warn("[SUPABASE_FETCH] Could not fetch distinct categories:", categoriesRes.error);
        }

    } catch (distinctValuesError) {
        console.error("[SUPABASE_FETCH] Error fetching distinct filter values:", distinctValuesError);
    }

    return {
        emails: emails,
        total: count || 0,
        currentPage: page,
        pageSize: limit,
        totalPages: Math.ceil((count || 0) / limit),
        accounts: distinctAccounts,
        folders: distinctFolders,
        categories: distinctCategories,
    };

  } catch (error) {
    console.error("[SUPABASE_FETCH] Overall failure in fetchEmails:", error);
    return { emails: [], total: 0, accounts: [], folders: [], categories: [], currentPage: 1, pageSize: 0, totalPages: 0 };
  }
};

// suggestReplies function remains the same if it's intended to hit your external backend.
// If suggestReplies should also use Supabase directly (e.g., to fetch email details by ID from Supabase
// before calling an AI), then it would also need to be rewritten.
export const suggestReplies = async (emailId: string, intent: any): Promise<{ suggestions: string[] }> => {
    const url = `${API_BASE_URL}/emails/${emailId}/suggest-reply`;
    console.log(`Requesting suggestions from: ${url} with intent: ${intent}`);
    try {
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        // Add auth header if your backend API needs it
        // const { data: { session } } = await supabase.auth.getSession();
        // if (session?.access_token) {
        //   headers['Authorization'] = `Bearer ${session.access_token}`;
        // }
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ intent }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
        }
        const dataToReturn: { suggestions: string[] } = await response.json();
        return dataToReturn;
    } catch (error) {
        console.error("Failed to fetch reply suggestions:", error);
        return { suggestions: [] };
    }
};