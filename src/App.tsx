import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailDocument } from './types/email';
import { fetchEmails, FetchEmailsParams }
// @ts-ignore
from './lib/api';
import { AccountFilter } from './components/filters/AccountFilter';
import { FolderFilter } from './components/filters/FolderFilter';
import { SearchBar } from './components/search/SearchBar';
import { EmailList } from './components/emails/EmailList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeProvider } from './contexts/ThemeContext';
import { ModeToggle } from './components/mode-toggle';
import { CategoryFilter } from './components/filters/CategoryFilter';

const DEFAULT_PAGE_SIZE = 15; // Define a default page size

function App() {
    const [emails, setEmails] = useState<EmailDocument[]>([]);
    const [totalEmails, setTotalEmails] = useState<number>(0);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [folders, setFolders] = useState<string[]>([]);
    // Categories might also be fetched from API if dynamic, for now, it's static in EmailList or passed
    // const [categories, setCategories] = useState<string[]>([]); 

    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Debouncing for search
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); // Or allow user to change

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1); // Reset to first page on new search
        }, 500);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchTerm]);

    const loadEmails = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        const params: FetchEmailsParams = {
            search: debouncedSearchTerm || undefined,
            account: selectedAccount,
            folder: selectedFolder,
            category: selectedCategory,
            page: currentPage,
            limit: pageSize,
        };

        try {
            const response = await fetchEmails(params);
            setEmails(response.emails || []);
            setTotalEmails(response.total || 0);
            setTotalPages(response.totalPages || 0);
            // The API might also return current page and page size, but we manage them in frontend state primarily
            // setCurrentPage(response.currentPage || 1); // Or trust our state
            // setPageSize(response.pageSize || DEFAULT_PAGE_SIZE); // Or trust our state

            // Only update accounts and folders if they are not already set,
            // or if you want them to be dynamic based on current filter results (less common for fixed lists)
            if (accounts.length === 0 && response.accounts && response.accounts.length > 0) {
                setAccounts(response.accounts);
            }
            if (folders.length === 0 && response.folders && response.folders.length > 0) {
                setFolders(response.folders);
            }
            // Similarly for categories if fetched
            // if (categories.length === 0 && response.categories && response.categories.length > 0) {
            //     setCategories(response.categories);
            // }

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load emails');
            setEmails([]);
            setTotalEmails(0);
            setTotalPages(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory, currentPage, pageSize, accounts, folders]); // Added accounts, folders to deps

    useEffect(() => {
        loadEmails();
    }, [loadEmails]); // loadEmails itself is memoized with its dependencies

    const handleAccountChange = (account: string | undefined) => {
        setSelectedAccount(account);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleFolderChange = (folder: string | undefined) => {
        setSelectedFolder(folder);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleCategoryChange = (category: string | undefined) => {
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page on filter change
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        // setCurrentPage(1) is handled by debouncedSearchTerm effect
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    return (
        <ThemeProvider>
            <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters & Search</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <SearchBar
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                            />
                            <AccountFilter
                                accounts={accounts} // Assuming accounts are fetched and populated
                                selectedAccount={selectedAccount}
                                onAccountChange={handleAccountChange}
                            />
                            <FolderFilter
                                folders={folders} // Assuming folders are fetched and populated
                                selectedFolder={selectedFolder}
                                onFolderChange={handleFolderChange}
                            />
                            <CategoryFilter
                                // categories={categories} // Pass if you fetch dynamic categories
                                selectedCategory={selectedCategory}
                                onCategoryChange={handleCategoryChange}
                            />
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