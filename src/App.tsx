import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailDocument } from './types/email';
import { fetchEmails, FetchEmailsParams } from './lib/api'; // Make sure fetchEmails can handle being called without auth or with it
import { AccountFilter } from './components/filters/AccountFilter';
import { FolderFilter } from './components/filters/FolderFilter';
import { SearchBar } from './components/search/SearchBar';
import { EmailList } from './components/emails/EmailList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // For Logout
import { ThemeProvider } from './contexts/ThemeContext';
import { ModeToggle } from './components/mode-toggle';
import { CategoryFilter } from './components/filters/CategoryFilter';
import { PageSizeSelector } from './components/filters/PageSizeSelector';

import { supabase } from './supabaseClient'; // Import Supabase client
import { Auth } from './components/auth/Auth';   // Import Auth component
import type { Session } from '@supabase/supabase-js';

const DEFAULT_PAGE_SIZE = 15;

function App() {
    const [session, setSession] = useState<Session | null>(null); // Auth session state

    const [emails, setEmails] = useState<EmailDocument[]>([]);
    const [totalEmails, setTotalEmails] = useState<number>(0);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [folders, setFolders] = useState<string[]>([]);

    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false); // Initially false until session is checked
    const [error, setError] = useState<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

    // Check and set current session
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // If there's no session, we might not want to load emails yet,
            // but the Auth component will be shown.
            // If there IS a session, the main loadEmails effect will trigger.
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (_event === 'SIGNED_OUT') {
                // Clear data on sign out
                setEmails([]);
                setTotalEmails(0);
                setTotalPages(0);
                setCurrentPage(1);
                // Optionally reset filters
                setSelectedAccount(undefined);
                setSelectedFolder(undefined);
                setSelectedCategory(undefined);
                setSearchTerm('');
                setDebouncedSearchTerm('');
            } else if (_event === 'SIGNED_IN') {
                // Optionally trigger a reload or reset page if needed
                setCurrentPage(1);
            }
        });

        return () => subscription.unsubscribe();
    }, []);


    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            if (session) setCurrentPage(1); // Reset to first page only if logged in
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm, session]);

    const loadEmails = useCallback(async () => {
        if (!session) { // Don't load emails if not authenticated
            setEmails([]); // Clear emails if session is lost
            setTotalEmails(0);
            setTotalPages(0);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        // Pass the auth token if your API `fetchEmails` requires it.
        // For direct Supabase client usage within `fetchEmails` this might not be needed
        // as the client handles it, but for custom APIs it is.
        // const token = session.access_token; 
        const params: FetchEmailsParams = {
            search: debouncedSearchTerm || undefined,
            account: selectedAccount,
            folder: selectedFolder,
            category: selectedCategory,
            page: currentPage,
            limit: pageSize,
            // token: token // If your fetchEmails function is adapted to use it
        };

        try {
            const response = await fetchEmails(params);
            setEmails(response.emails || []);
            setTotalEmails(response.total || 0);
            setTotalPages(response.totalPages || 0);

            if (accounts.length === 0 && response.accounts && response.accounts.length > 0) {
                setAccounts(response.accounts);
            }
            if (folders.length === 0 && response.folders && response.folders.length > 0) {
                setFolders(response.folders);
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load emails');
            setEmails([]);
            setTotalEmails(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [session, debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory, currentPage, pageSize, accounts, folders]);

    useEffect(() => {
        // Load emails only if there's an active session
        if (session) {
            loadEmails();
        } else {
            // Ensure data is cleared if session becomes null (e.g. after logout)
             setEmails([]);
             setTotalEmails(0);
             setTotalPages(0);
             setIsLoading(false); // Not loading if no session
        }
    }, [session, loadEmails]); // loadEmails is a dependency

    const handleAccountChange = (account: string | undefined) => {
        setSelectedAccount(account);
        if (session) setCurrentPage(1);
    };

    const handleFolderChange = (folder: string | undefined) => {
        setSelectedFolder(folder);
        if (session) setCurrentPage(1);
    };

    const handleCategoryChange = (category: string | undefined) => {
        setSelectedCategory(category);
        if (session) setCurrentPage(1);
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages && session) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        if (session) setCurrentPage(1);
    };

    const handleLogout = async () => {
        setIsLoading(true); // Optional: show loading state during logout
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error logging out:', error);
            setError("Failed to log out.");
        }
        // The onAuthStateChange listener will handle setting session to null
        // and clearing data.
        setIsLoading(false);
    };

    // If session is null (no user logged in), render the Auth component
    if (!session) {
        return (
            <ThemeProvider>
                <Auth />
            </ThemeProvider>
        );
    }

    // Otherwise, render the main application
    return (
        <ThemeProvider>
            <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Welcome!</CardTitle>
                             <p className="text-xs text-muted-foreground truncate" title={session.user?.email}>{session.user?.email}</p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SearchBar
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                            />
                            <AccountFilter
                                accounts={accounts}
                                selectedAccount={selectedAccount}
                                onAccountChange={handleAccountChange}
                            />
                            <FolderFilter
                                folders={folders}
                                selectedFolder={selectedFolder}
                                onFolderChange={handleFolderChange}
                            />
                            <CategoryFilter
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                            />
                            <PageSizeSelector
                                pageSize={pageSize}
                                onPageSizeChange={handlePageSizeChange}
                            />
                             <Button onClick={handleLogout} variant="outline" className="w-full mt-2">
                                Logout
                            </Button>
                        </CardContent>
                    </Card>
                </aside>

                <main className="flex-grow min-w-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                <div className='flex items-center justify-between'>
                                    <span>Emails ({isLoading ? '...' : totalEmails})</span>
                                    <ModeToggle />
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <EmailList
                                emails={emails}
                                isLoading={isLoading}
                                error={error}
                                totalEmails={totalEmails}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;