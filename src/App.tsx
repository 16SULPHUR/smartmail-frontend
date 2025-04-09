import { useState, useEffect, useCallback, useRef } from 'react';
import { EmailDocument } from './types/email'; 
import { fetchEmails, FetchEmailsParams } from './lib/api'; 
import { AccountFilter } from './components/filters/AccountFilter'; 
import { FolderFilter } from './components/filters/FolderFilter'; 
import { SearchBar } from './components/search/SearchBar'; 
import { EmailList } from './components/emails/EmailList'; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { ThemeProvider } from './contexts/ThemeContext'; 
import { ModeToggle } from './components/mode-toggle'; 
import { CategoryFilter } from './components/filters/CategoryFilter'; 


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

    useEffect(() => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
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
        };

        try {
            const response = await fetchEmails(params);
            setEmails(response.emails || []);
            setTotalEmails(response.total || 0);

            const uniqueAccounts = response.accounts || [];
            const uniqueFolders = response.folders || [];

            if (uniqueAccounts.length > 0) setAccounts(uniqueAccounts);
            if (uniqueFolders.length > 0) setFolders(uniqueFolders);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load emails');
            setEmails([]);
            setTotalEmails(0);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedSearchTerm, selectedAccount, selectedFolder, selectedCategory]);

    useEffect(() => {
        loadEmails();
    }, [loadEmails]);

    const handleAccountChange = (account: string | undefined) => {
        setSelectedAccount(account);
    };

    const handleFolderChange = (folder: string | undefined) => {
        setSelectedFolder(folder);
    };

    const handleCategoryChange = (category: string | undefined) => {
        setSelectedCategory(category);
    };

    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
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
                            />
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ThemeProvider>
    );
}

export default App;