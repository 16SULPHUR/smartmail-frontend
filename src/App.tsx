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
import { PageSizeSelector } from './components/filters/PageSizeSelector';

const DEFAULT_PAGE_SIZE = 15;

function App() {
    const [emails, setEmails] = useState<EmailDocument[]>([]);
    const [totalEmails, setTotalEmails] = useState<number>(0);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [folders, setFolders] = useState<string[]>([]);

    const [selectedAccount, setSelectedAccount] = useState<string | undefined>(undefined);
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>(undefined);
    const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(0);
    const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE); // This now can be changed by the user

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
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
    }, [debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory, currentPage, pageSize, accounts, folders]);

    useEffect(() => {
        loadEmails();
    }, [loadEmails]);

    const handleAccountChange = (account: string | undefined) => {
        setSelectedAccount(account);
        setCurrentPage(1);
    };

    const handleFolderChange = (folder: string | undefined) => {
        setSelectedFolder(folder);
        setCurrentPage(1);
    };

    const handleCategoryChange = (category: string | undefined) => {
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage > 0 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handlePageSizeChange = (newPageSize: number) => {
        setPageSize(newPageSize);
        setCurrentPage(1); // Reset to first page when page size changes
    };

    return (
        <ThemeProvider>
            <div className="container mx-auto p-4 flex flex-col md:flex-row gap-6">
                <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 sticky top-4 self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Filters & Display</CardTitle> {/* Changed title slightly */}
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
                            <PageSizeSelector // Add the PageSizeSelector here
                                pageSize={pageSize}
                                onPageSizeChange={handlePageSizeChange}
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