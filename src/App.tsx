// src/App.tsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailDocument } from './types/email';
import { fetchEmails, FetchEmailsParams } from './lib/api';
import { AccountFilter } from './components/filters/AccountFilter';
import { FolderFilter } from './components/filters/FolderFilter';
import { CategoryFilter } from './components/filters/CategoryFilter';
import { PageSizeSelector } from './components/filters/PageSizeSelector';
import { ModeToggle } from './components/mode-toggle';
import { SearchBar } from './components/search/SearchBar';
import { EmailList } from './components/emails/EmailList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from './contexts/ThemeContext';
import { Button } from "@/components/ui/button";
import { supabase } from './supabaseClient'; // Your Supabase frontend client
import { Auth } from './components/auth/Auth'; // Your Auth component (ensure name matches export)
import type { Session } from '@supabase/supabase-js';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';
import { Filter, LogOut } from 'lucide-react'; // Added LogOut icon

const DEFAULT_PAGE_SIZE = 15;

function App() {
    const [session, setSession] = useState<Session | null>(null);
    const [authLoading, setAuthLoading] = useState(true); // For initial session check

    const [emails, setEmails] = useState<EmailDocument[]>([]);
    const [totalEmails, setTotalEmails] = useState<number>(0);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);

    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false); // For email loading
    const [error, setError] = useState<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
    
    const initialFiltersLoaded = useRef(false); // To load filter dropdown options once

    // Authentication listener and initial session check
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setAuthLoading(false);
            if (_event === 'SIGNED_OUT') {
                setEmails([]); setTotalEmails(0); setTotalPages(0); setCurrentPage(1);
                setSelectedAccount(undefined); setSelectedFolder(undefined); setSelectedCategory(undefined);
                setSearchTerm(''); setDebouncedSearchTerm('');
                setAccounts([]); setFolders([]); setCategories([]); // Clear filter options
                initialFiltersLoaded.current = false;
            } else if (_event === 'SIGNED_IN') {
                setCurrentPage(1); // Reset to page 1 on new sign-in
                initialFiltersLoaded.current = false; // Allow filters to reload
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    // Debounce search term
    useEffect(() => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);
        return () => { if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current); };
    }, [searchTerm]);

    // loadEmails function - now relies entirely on backend API for data and filter options
    const loadEmails = useCallback(async (pageToLoad: number, filters: FetchEmailsParams) => {
        if (!session) { // Should not be called if no session, but as a safeguard
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);

        const params: FetchEmailsParams = {
            ...filters,
            page: pageToLoad,
            limit: pageSize,
            // token: session.access_token, // If your backend 'fetchEmails' API endpoint needs it
        };
        console.log('[App] loadEmails called with params:', params);

        try {
            const response = await fetchEmails(params); // Calls your backend API
            setEmails(response.emails || []);
            setTotalEmails(response.total || 0);
            setTotalPages(response.totalPages || 0);
            setCurrentPage(response.currentPage || 1);
            setPageSize(response.pageSize || DEFAULT_PAGE_SIZE);

            // Update filter options if they are new or haven't been loaded yet
            // The API is now the source of truth for these filter options
            if (!initialFiltersLoaded.current || (response.accounts && response.accounts.length > 0)) {
                setAccounts(response.accounts || []);
            }
            if (!initialFiltersLoaded.current || (response.folders && response.folders.length > 0)) {
                setFolders(response.folders || []);
            }
            if (!initialFiltersLoaded.current || (response.categories && response.categories.length > 0)) {
                setCategories(response.categories || []);
            }
            if (response.accounts || response.folders || response.categories) {
                initialFiltersLoaded.current = true;
            }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load emails');
            setEmails([]); setTotalEmails(0); setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [session, pageSize]); // Only session and pageSize are direct dependencies for the function itself

    // Effect to load emails when filters or current page change, only if session exists
    useEffect(() => {
        if (session) {
            const currentFilters: FetchEmailsParams = {
                search: debouncedSearchTerm || undefined,
                account: selectedAccount,
                folder: selectedFolder,
                category: selectedCategory,
            };
            loadEmails(currentPage, currentFilters);
        }
    }, [session, debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory, currentPage, loadEmails]);

    // Effect to reset page to 1 when any filter (including debouncedSearchTerm) changes
    useEffect(() => {
        if (initialFiltersLoaded.current) { // Avoid resetting on initial mount before first load
            setCurrentPage(1);
        }
    }, [debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory]);

    const handleAccountChange = (account: string | undefined) => setSelectedAccount(account);
    const handleFolderChange = (folder: string | undefined) => setSelectedFolder(folder);
    const handleCategoryChange = (category: string | undefined) => setSelectedCategory(category);
    const handleSearchChange = (term: string) => setSearchTerm(term);
    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
    };
    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); 
    };

    const handleLogout = async () => {
        setIsLoading(true);
        await supabase.auth.signOut();
        // onAuthStateChange will handle clearing state and session
        setIsLoading(false);
    };

    if (authLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>; // Or a better spinner
    }

    if (!session) {
        return (
            <ThemeProvider> {/* Assuming AuthPage uses ThemeContext or provide it directly */}
                <Auth />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <div className="container mx-auto p-4">
                <div className="md:hidden mb-4">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="filters">
                            <AccordionTrigger className="bg-card p-4 rounded-lg shadow">
                                <div className="flex items-center gap-2"><Filter size={18} /> Filters & Search</div>
                            </AccordionTrigger>
                            <AccordionContent className="p-4 bg-card border-t mt-[-1px] rounded-b-lg">
                                <div className="space-y-4">
                                    <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
                                    <AccountFilter accounts={accounts} selectedAccount={selectedAccount} onAccountChange={handleAccountChange} />
                                    <FolderFilter folders={folders} selectedFolder={selectedFolder} onFolderChange={handleFolderChange} />
                                    <CategoryFilter availableCategories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
                                    <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                                     <Button onClick={handleLogout} variant="outline" className="w-full mt-2">
                                        <LogOut className="mr-2 h-4 w-4" /> Logout
                                    </Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>

                <div className="flex flex-col md:flex-row gap-6">
                    <aside className="hidden md:block w-full md:w-64 lg:w-72 flex-shrink-0 md:sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg">Mail Filters</CardTitle>
                                <p className="text-xs text-muted-foreground truncate" title={session.user?.email}>{session.user?.email}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
                                <AccountFilter accounts={accounts} selectedAccount={selectedAccount} onAccountChange={handleAccountChange} />
                                <FolderFilter folders={folders} selectedFolder={selectedFolder} onFolderChange={handleFolderChange} />
                                <CategoryFilter availableCategories={categories} selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />
                                <PageSizeSelector pageSize={pageSize} onPageSizeChange={handlePageSizeChange} />
                                <Button onClick={handleLogout} variant="outline" className="w-full mt-2">
                                   <LogOut className="mr-2 h-4 w-4" /> Logout
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>

                    <main className="flex-grow min-w-0">
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    <div className='flex items-center justify-between'>
                                        <span>Emails ({isLoading && session ? 'Loading...' : totalEmails})</span> {/* Show total only if session exists */}
                                        <ModeToggle />
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <EmailList
                                    emails={emails}
                                    isLoading={isLoading && !!session} // Only show loading if session exists and loading emails
                                    error={error}
                                    totalEmails={totalEmails}
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={handlePageChange}
                                />
                                {totalPages > 1 && !isLoading && session && (
                                    <div className="mt-4 flex justify-center items-center space-x-2">
                                        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1} size="sm">Previous</Button>
                                        <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
                                        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= totalPages} size="sm">Next</Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </main>
                </div>
            </div>
        </ThemeProvider>
    );
}

export default App;