import React, { useState, useMemo } from 'react';
import { EmailDocument, ReplyIntent } from '@/types/email'; // Ensure this path and types are correct
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter as DialogCoreFooter, // Renamed to avoid conflict
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { suggestReplies } from '@/lib/api'; // Ensure this path is correct
import { Loader2, Copy, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmailListProps {
  emails: EmailDocument[];
  isLoading: boolean;
  error: string | null;
  totalEmails: number;
  currentPage: number;    // Added for pagination
  totalPages: number;     // Added for pagination
  onPageChange: (newPage: number) => void; // Added for pagination
}

// These intents might need to be updated if you want e-commerce specific reply actions
const REPLY_INTENTS: ReplyIntent[] = [
    'Interested - Request Meeting',
    'Interested - Positive Reply',
    'Not Interested - Polite Decline',
    'Not Interested - Unsubscribe',
];

const getCategoryVariant = (category?: string | null): "default" | "destructive" | "outline" | "secondary"  => {
    switch (category?.toLowerCase()) {
        case 'new order': return 'default';
        case 'customer inquiry': return 'default';
        case 'order update': return 'secondary';
        case 'return processed': return 'outline';
        case 'refund issued': return 'outline';
        case 'platform notification': return 'secondary';
        case 'supplier/logistics communication': return 'secondary';
        case 'return request': return 'destructive';
        case 'payment dispute/chargeback': return 'destructive';
        case 'marketing/promotions (from platforms)': return 'outline';
        case 'other': return 'secondary';
        default: return 'secondary';
    }
};

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleDateString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
        });
    } catch (e) { return 'Invalid Date'; }
};

const formatDateTime = (dateString?: string | null): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toLocaleString(undefined, {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch (e) { return 'Invalid Date'; }
};


export const EmailList: React.FC<EmailListProps> = ({
  emails,
  isLoading,
  error,
  totalEmails,
  currentPage,
  totalPages,
  onPageChange,
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
    const [selectedIntent, setSelectedIntent] = useState<ReplyIntent | undefined>(undefined);
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const displayDate = useMemo(() => {
        return formatDateTime(email.received_at || email.sent_at || email.created_at);
    }, [email.received_at, email.sent_at, email.created_at]);

    const handleSuggestClick = async () => {
      if (!selectedIntent || !email.id) return;
      setIsSuggesting(true);
      setSuggestionError(null);
      setSuggestedReplies([]);
      setCopiedIndex(null);
      try {
        const response = await suggestReplies(email.id, selectedIntent);
        setSuggestedReplies(response.suggestions);
        if (response.suggestions.length === 0) {
             setSuggestionError("AI did not return any suggestions for this intent.");
        }
      } catch (err: any) {
        setSuggestionError(err.message || "Failed to fetch suggestions.");
      } finally {
        setIsSuggesting(false);
      }
    };

    const handleCopyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }).catch(err => console.error('Failed to copy text: ', err));
    };

    return (
      <DialogContent className="sm:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
           <DialogTitle className="truncate pr-10">{email.subject || '(No Subject)'}</DialogTitle>
           <DialogDescription>
                From: {email.from_address || 'N/A'} | To: {email.to_addresses?.join(', ') || 'N/A'} | Date: {displayDate}
                <br />
                Account: {email.account} | Folder: {email.folder || 'N/A'} | Category: <Badge variant={getCategoryVariant(email.category)} className="text-xs">{email.category || 'None'}</Badge>
           </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-2 space-y-4 border-t border-b my-2">
            {email.body_text && (
                <div>
                    <h4 className="font-semibold mb-1 text-sm">Text Content:</h4>
                    <pre className="text-xs whitespace-pre-wrap break-words p-2 rounded-md bg-muted text-muted-foreground max-h-[20vh] overflow-y-auto">
                        {email.body_text}
                    </pre>
                </div>
            )}
            {email.body_html && (
                <div>
                    <h4 className="font-semibold mb-1 text-sm">HTML Content:</h4>
                    <iframe
                        srcDoc={email.body_html}
                        sandbox="allow-same-origin allow-popups" // "allow-scripts" can be risky if HTML source is not trusted
                        title="Email HTML Content"
                        className="w-full h-[30vh] border rounded-md bg-background"
                        loading="lazy"
                    />
                </div>
             )}
             {!email.body_text && !email.body_html && ( <p className="text-sm text-muted-foreground">No message content available.</p> )}
        </div>

        <div className="flex-shrink-0 border-t pt-3 mt-1">
          <h4 className="font-semibold mb-2 text-sm">Suggest Reply</h4>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 mb-3">
            <Select
                value={selectedIntent || ""}
                onValueChange={(value) => setSelectedIntent(value as ReplyIntent)}
                disabled={isSuggesting}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Select reply intent..." />
              </SelectTrigger>
              <SelectContent>
                {REPLY_INTENTS.map(intent => (
                  <SelectItem key={intent} value={intent}>{intent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSuggestClick}
              disabled={!selectedIntent || isSuggesting}
              className="w-full sm:w-auto"
            >
              {isSuggesting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSuggesting ? 'Generating...' : 'Suggest'}
            </Button>
          </div>

          {isSuggesting && suggestedReplies.length === 0 && !suggestionError && (
              <div className="text-sm text-muted-foreground">Generating suggestions...</div>
          )}
          <div className="space-y-2 max-h-[25vh] overflow-y-auto">
            {suggestionError && <p className="text-red-600 text-sm">{suggestionError}</p>}
            {suggestedReplies.map((reply, index) => (
              <div key={index} className="p-2 border rounded-md bg-muted/50 relative group">
                <p className="text-sm whitespace-pre-wrap break-words">{reply}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                  onClick={() => handleCopyToClipboard(reply, index)}
                  title="Copy to clipboard"
                >
                   <Copy className={`h-3 w-3 ${copiedIndex === index ? 'text-green-600' : ''}`} />
                </Button>
              </div>
            ))}
          </div>
        </div>

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
                <TableCell>{formatDate(email.sent_at || email.created_at)}</TableCell>
                <TableCell>
                    {email.category ? (<Badge variant={getCategoryVariant(email.category)}>{email.category}</Badge>) : (<Badge variant="secondary">None</Badge>)}
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
        {totalPages > 1 && (
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