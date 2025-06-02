import { EmailDocument, ReplyIntent } from '@/types/email'; // Ensure this path is correct and types are updated

export interface ApiEmailsResponse {
  emails: EmailDocument[];
  total: number;
  currentPage?: number; // Added for pagination
  pageSize?: number;    // Added for pagination
  totalPages?: number;  // Added for pagination
  accounts?: string[];
  folders?: string[];
  // categories?: string[]; // If you add this
}

// const API_BASE_URL = 'http://localhost:3000/api';
const API_BASE_URL = 'https://outbox-assignment-kappa.vercel.app/api';

export interface FetchEmailsParams {
  search?: string;
  account?: string;
  folder?: string;
  category?: string;
  page?: number;    // Added for pagination
  limit?: number;   // Added for pagination (page size)
}

export const fetchEmails = async (params: FetchEmailsParams): Promise<ApiEmailsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set('search', params.search);
  if (params.account) queryParams.set('account', params.account);
  if (params.folder) queryParams.set('folder', params.folder); // Make sure backend supports this
  if (params.category) queryParams.set('category', params.category); // Make sure backend supports this
  if (params.page) queryParams.set('page', params.page.toString());
  if (params.limit) queryParams.set('limit', params.limit.toString());

  const url = `${API_BASE_URL}/emails?${queryParams.toString()}`;
  console.log('Fetching emails from URL:', url);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
      console.error("API Error Data:", errorData);
      throw new Error(errorData.message || `API request failed with status ${response.status}`);
    }
    const data: ApiEmailsResponse = await response.json();

    // The backend should now return dates as ISO strings (e.g., sent_at, received_at).
    // The frontend EmailDocument type expects these as strings.
    // If you need to display a single "date" for sorting or display, you can derive it.
    // The previous mapping to a single 'date' field is removed as EmailDocument now has specific date fields.
    // If your UI components expect a single 'date' field, you'll need to add that mapping back
    // or update the UI components to use 'received_at' or 'sent_at'.

    // Example: If you still want a generic 'displayDate' for UI convenience (not part of core EmailDocument)
    const emailsWithDisplayDate = (data.emails || []).map(email => ({
        ...email,
        // Convert ISO strings to Date objects if needed by UI components,
        // but the EmailDocument type itself expects strings for these.
        // For display, it's often better to parse them where they are used.
        // displayDate: new Date(email.received_at || email.sent_at || email.created_at || Date.now()),
    }));

    console.log(data)


    return {
        emails: emailsWithDisplayDate, // or just data.emails if you don't add a displayDate
        total: data.total || 0,
        currentPage: data.currentPage,
        pageSize: data.pageSize,
        totalPages: data.totalPages,
        accounts: data.accounts || [],
        folders: data.folders || [],
    };

  } catch (error) {
    console.error("Failed to fetch emails:", error);
    // Return a structure that matches ApiEmailsResponse, even on error
    return {
        emails: [],
        total: 0,
        currentPage: 1,
        pageSize: 0,
        totalPages: 0,
        accounts: [],
        folders: []
    };
  }
};

export const suggestReplies = async (emailId: string, intent: ReplyIntent): Promise<{ suggestions: string[] }> => {
    const url = `${API_BASE_URL}/emails/${emailId}/suggest-reply`;
    console.log(`Requesting suggestions from: ${url} with intent: ${intent}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ intent }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: "Unknown error during reply suggestion." }));
            console.error("API Error Data (suggestReplies):", errorData);
            throw new Error(errorData.message || `API request failed with status ${response.status}`);
        }

        const data: { suggestions: string[] } = await response.json();
        return data;

    } catch (error) {
        console.error("Failed to fetch reply suggestions:", error);
        return { suggestions: [] }; // Return empty suggestions on error
    }
};