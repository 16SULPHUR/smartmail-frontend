import React, { useState } from 'react';
import { EmailDocument, ReplyIntent } from '@/types/email';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { suggestReplies } from '@/lib/api';
import { Loader2, Copy } from 'lucide-react';

interface EmailListProps {
  emails: EmailDocument[];
  isLoading: boolean;
  error: string | null;
  totalEmails: number;
}

const REPLY_INTENTS: ReplyIntent[] = [
    'Interested - Request Meeting',
    'Interested - Positive Reply',
    'Not Interested - Polite Decline',
    'Not Interested - Unsubscribe',
];

const getCategoryVariant = (category?: string | null): "default" | "destructive" | "outline" | "secondary" => {
    switch (category?.toLowerCase()) {
        case 'interested': return 'default';
        case 'meeting booked': return 'default';
        case 'not interested': return 'secondary';
        case 'spam': return 'destructive';
        case 'out of office': return 'outline';
        case 'other': return 'secondary';
        default: return 'secondary';
    }
};

export const EmailList: React.FC<EmailListProps> = ({ emails, isLoading, error}) => {
  if (error) {
    return <div className="text-red-600 p-4">Error loading emails: {error}</div>;
  }

  const renderSkeletons = () => (
    Array.from({ length: 5 }).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-[250px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
        <TableCell><Skeleton className="h-4 w-[60px]" /></TableCell>
      </TableRow>
    ))
  );

  const EmailViewDialogContent: React.FC<{ email: EmailDocument }> = ({ email }) => {
    const [selectedIntent, setSelectedIntent] = useState<ReplyIntent | undefined>(undefined);
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isSuggesting, setIsSuggesting] = useState<boolean>(false);
    const [suggestionError, setSuggestionError] = useState<string | null>(null);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
             setSuggestionError("AI did not return any suggestions.");
        }
      } catch (err: any) {
        setSuggestionError(err.message || "Failed to fetch suggestions.");
        setSuggestedReplies([]);
      } finally {
        setIsSuggesting(false);
      }
    };

    const handleCopyToClipboard = (text: string, index: number) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedIndex(index);
            setTimeout(() => setCopiedIndex(null), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
      <DialogContent className="sm:max-w-[80vw] lg:max-w-[70vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
           <DialogTitle className="truncate pr-10">{email.subject || '(No Subject)'}</DialogTitle>
           <DialogDescription>
                From: {email.from || 'N/A'} | To: {email.to || 'N/A'} | Date: {email.date instanceof Date ? email.date.toLocaleString() : 'Invalid Date'}
                <br />
                Account: {email.account} | Folder: {email.folder} | Category: {email.category || 'None'}
           </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-y-auto pr-2 py-2 space-y-4 border-t border-b my-2">
            {email.text && (
                <div>
                    <h4 className="font-semibold mb-1 text-sm">Text Content:</h4>
                    <pre className="text-xs whitespace-pre-wrap break-words p-2 rounded-md bg-muted text-muted-foreground max-h-[20vh] overflow-y-auto">
                        {email.text}
                    </pre>
                </div>
            )}
            {email.html && (
                <div>
                    <h4 className="font-semibold mb-1 text-sm">HTML Content:</h4>
                    <iframe
                        srcDoc={email.html}
                        sandbox="allow-same-origin"
                        title="Email HTML Content"
                        className="w-full h-[30vh] border rounded-md bg-background"
                        loading="lazy"
                    />
                </div>
             )}
             {!email.text && !email.html && ( <p>...</p> )}
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
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSuggesting ? 'Generating...' : 'Suggest'}
            </Button>
          </div>

          <div className="space-y-2 max-h-[25vh] overflow-y-auto">
            {suggestionError && <p className="text-red-600 text-sm">{suggestionError}</p>}
            {suggestedReplies.map((reply, index) => (
              <div key={index} className="p-2 border rounded-md bg-muted/50 relative group">
                <p className="text-sm whitespace-pre-wrap break-words">{reply}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-1 right-1 h-6 w-6 opacity-50 group-hover:opacity-100 transition-opacity"
                  onClick={() => handleCopyToClipboard(reply, index)}
                  title="Copy to clipboard"
                >
                   <Copy className={`h-3 w-3 ${copiedIndex === index ? 'text-green-600' : ''}`} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    );
  };

  return (
    <Table>
      <TableHeader>
          <TableRow>
              <TableHead className="w-[30%]">Subject</TableHead>
              <TableHead>From</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Folder</TableHead>
              <TableHead className="text-right">Actions</TableHead>
          </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? renderSkeletons() : emails.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="text-center py-10">No emails found.</TableCell></TableRow>
        ) : (
          emails.map((email) => (
            <TableRow key={email.id || email.messageId || `${email.account}-${email.folder}-${email.date.toString()}`}>
              <TableCell className="font-medium truncate max-w-xs" title={email.subject || ''}>{email.subject || '(No Subject)'}</TableCell>
              <TableCell className="truncate max-w-[200px]" title={email.from || ''}>{email.from || 'N/A'}</TableCell>
              <TableCell>{email.date instanceof Date ? email.date.toLocaleDateString() : 'Invalid Date'}</TableCell>
              <TableCell>
                  {email.category ? (<Badge variant={getCategoryVariant(email.category)}>{email.category}</Badge>) : (<Badge variant="secondary">None</Badge>)}
              </TableCell>
              <TableCell>{email.account}</TableCell>
              <TableCell>{email.folder}</TableCell>
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
    </Table>
  );
};