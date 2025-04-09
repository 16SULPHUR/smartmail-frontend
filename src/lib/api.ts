import { EmailDocument, ReplyIntent } from '@/types/email';

export interface ApiEmailsResponse {
  emails: EmailDocument[];
  total: number;
  accounts?: string[];
  folders?: string[];
}

const API_BASE_URL = 'http://localhost:3000/api';

export interface FetchEmailsParams {
  search?: string;
  account?: string;
  folder?: string;
  category?: string;
}

export const fetchEmails = async (params: FetchEmailsParams): Promise<ApiEmailsResponse> => {
  const queryParams = new URLSearchParams();

  if (params.search) queryParams.set('search', params.search);
  if (params.account) queryParams.set('account', params.account);
  if (params.folder) queryParams.set('folder', params.folder);
  if (params.category) queryParams.set('category', params.category);

  const url = `${API_BASE_URL}/emails?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    const data: ApiEmailsResponse = await response.json();

    data.emails = (data.emails || []).map(email => ({
        ...email,
        date: new Date(email.date),
    }));

    return {
        emails: data.emails || [],
        total: data.total || 0,
        accounts: data.accounts || [],
        folders: data.folders || [],
    };

  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return { emails: [], total: 0, accounts: [], folders: [] };
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API request failed with status ${response.status}: ${errorData.message || 'Unknown error'}`);
        }

        const data: { suggestions: string[] } = await response.json();
        return data;

    } catch (error) {
        console.error("Failed to fetch reply suggestions:", error);
       
        return { suggestions: [] };
    }
};
