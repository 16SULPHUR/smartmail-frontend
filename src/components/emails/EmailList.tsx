// src/components/emails/EmailList.tsx
import React, { useMemo } from 'react';
import { EmailDocument } from '@/types/email';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from "@/components/ui/table";
// Badge component is no longer used for category display here, but might be used elsewhere.
// import { Badge } from "@/components/ui/badge"; 
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter as DialogCoreFooter,
} from "@/components/ui/dialog";
// Select components are removed from here as they are not used directly in EmailList
// If you had ReplyIntent select here, it would need its imports

import { ChevronLeft, ChevronRight } from 'lucide-react';
// Loader2, Copy, Select components are removed as they are part of EmailViewDialogContent's suggestReplies which was commented out

interface EmailListProps {
  emails: EmailDocument[];
  isLoading: boolean;
  error: string | null;
  totalEmails: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

// MODIFIED: This function now returns Tailwind CSS class strings
const getCategoryClasses = (category?: string | null): string => {
  const baseClasses = "px-2.5 py-0.5 text-xs font-semibold rounded-full border"; // Common badge-like styling

  switch (category?.toLowerCase()) {
    case 'new order': 
      return `${baseClasses} bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700`;
    case 'customer inquiry': 
      return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700`;
    case 'order update': 
      return `${baseClasses} bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900 dark:text-sky-200 dark:border-sky-700`;
    case 'return processed': 
      return `${baseClasses} bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700`;
    case 'refund issued': 
      return `${baseClasses} bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-700`;
    case 'platform notification': 
      return `${baseClasses} bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-500`;
    case 'supplier/logistics communication': 
      return `${baseClasses} bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700`;
    case 'return request': 
      return `${baseClasses} bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-700 dark:text-yellow-100 dark:border-yellow-600`; // More warning like
    case 'payment dispute/chargeback': 
      return `${baseClasses} bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700`;
    case 'marketing/promotions (from platforms)': 
      return `${baseClasses} bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-700`;
    case 'uncategorized':
    case 'other': 
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500`;
  }
};

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } 
    catch (e) { return 'Invalid Date'; }
};

const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try { return new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); } 
    catch (e) { return 'Invalid Date'; }
};

export const EmailList: React.FC<EmailListProps> = ({
  emails, isLoading, error, totalEmails, currentPage, totalPages, onPageChange,
}) => {

  if (error) {
    return <div className="text-red-600 p-4">Error loading emails: {error}</div>;
  }

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ))
  );

  const EmailViewDialogContent: React.FC<{ email: EmailDocument }> = ({ email }) => {
    const displayDate = useMemo(() => {
      return formatDateTime(email.received_at || email.sent_at || email.created_at);
    }, [email.received_at, email.sent_at, email.created_at]);

    // Reply suggestion state and handlers are removed as the UI for it was commented out
    // If you re-add reply suggestions, you'll need to bring back that state and logic.

    return (
      <DialogContent className="sm:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate pr-10">{email.subject || '(No Subject)'}</DialogTitle>
          <DialogDescription>
            From: {email.from_address || 'N/A'} | To: {email.to_addresses?.join(', ') || 'N/A'} | Date: {displayDate}
            <br />
            Account: {email.account} | Folder: {email.folder || 'N/A'} | Category: {/* MODIFIED */}
            <span className={getCategoryClasses(email.category)}>
              {email.category || 'None'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-2 space-y-4 border-t border-b my-2">
          {email.body_text && ( /* ... text content ... */
            <div>
              <h4 className="font-semibold mb-1 text-sm">Text Content:</h4>
              <pre className="text-xs whitespace-pre-wrap break-words p-2 rounded-md bg-muted text-muted-foreground max-h-[20vh] overflow-y-auto">
                {email.body_text}
              </pre>
            </div>
          )}
          {email.body_html && (  /* ... html content ... */
            <div>
              <h4 className="font-semibold mb-1 text-sm">HTML Content:</h4>
              <iframe
                srcDoc={email.body_html}
                sandbox="allow-same-origin allow-popups"
                title="Email HTML Content"
                className="w-full h-[30vh] border rounded-md bg-white dark:bg-neutral-800" // Adjusted bg for dark mode
                loading="lazy"
              />
            </div>
          )}
          {!email.body_text && !email.body_html && (<p className="text-sm text-muted-foreground">No message content available.</p>)}
        </div>

        {/* Reply suggestion UI is removed as it was commented out in your provided code */}

        <DialogCoreFooter className="flex-shrink-0 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogCoreFooter>
      </DialogContent>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[30%] min-w-[200px]">Subject</TableHead>
            <TableHead className="min-w-[150px]">From</TableHead>
            <TableHead className="min-w-[120px]">Date</TableHead>
            <TableHead className="min-w-[100px]">Category</TableHead>
            <TableHead className="min-w-[150px]">Account</TableHead>
            <TableHead className="min-w-[100px]">Folder</TableHead>
            <TableHead className="text-right min-w-[80px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? renderSkeletons() : emails.length === 0 ? (
            <TableRow><TableCell colSpan={7} className="text-center py-10">No emails found {totalEmails > 0 ? '(with current filters)' : ''}.</TableCell></TableRow>
          ) : (
            emails.map((email) => (
              <TableRow key={email.id || email.unique_identifier}>
                <TableCell className="font-medium truncate max-w-xs" title={email.subject || ''}>{email.subject || '(No Subject)'}</TableCell>
                <TableCell className="truncate max-w-[200px]" title={email.from_address || ''}>{email.from_address || 'N/A'}</TableCell>
                <TableCell>{formatDate(email.sent_at || email.received_at || email.created_at)}</TableCell> {/* Prioritize sent_at then created_at */}
                <TableCell>
                  {/* MODIFIED: Use span with dynamic classes instead of Badge */}
                  {email.category ? (
                    <span className={getCategoryClasses(email.category)}>
                      {email.category}
                    </span>
                  ) : (
                    <span className={getCategoryClasses(null)}> {/* Or specific class for 'None' */}
                      None
                    </span>
                  )}
                </TableCell>
                <TableCell>{email.account}</TableCell>
                <TableCell>{email.folder || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">View</Button>
                    </DialogTrigger>
                    <EmailViewDialogContent email={email} />
                  </Dialog>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        {totalPages > 1 && !isLoading && ( // Added !isLoading condition for pagination
          <TableFooter>
            <TableRow>
              <TableCell colSpan={7}>
                <div className="flex items-center justify-between py-2">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}. Total {totalEmails} emails.
                  </div>
                  <div className="space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || isLoading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || isLoading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </>
  );
};