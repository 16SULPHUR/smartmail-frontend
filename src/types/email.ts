// src/types/email.ts
export interface EmailDocument {
    id?: string; // Elasticsearch ID or generated ID
    subject: string | null;
    from?: string;
    to?: string;
    text?: string;
    html?: string; // <-- Added/Ensure it's here
    date: string | Date;
    messageId?: string;
    account: string;
    folder: string;
    category?: string | null;
  }
  
  export interface ApiEmailsResponse {
    emails: EmailDocument[];
    total: number;
    accounts?: string[]; 
    folders?: string[]; 
  }

  export type ReplyIntent = 'Interested - Request Meeting' | 'Interested - Positive Reply' | 'Not Interested - Polite Decline' | 'Not Interested - Unsubscribe' ;