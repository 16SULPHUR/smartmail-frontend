import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AccountFilterProps {
  accounts: string[];
  selectedAccount: string | undefined;
  onAccountChange: (account: string | undefined) => void;
}

export const AccountFilter: React.FC<AccountFilterProps> = ({
  accounts,
  selectedAccount,
  onAccountChange,
}) => {
  const handleValueChange = (value: string) => {
    onAccountChange(value === 'all' ? undefined : value);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="account-filter" className="text-sm font-medium">Account</label>
      <Select
        value={selectedAccount || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="account-filter" className="w-[180px]">
          <SelectValue placeholder="Select account" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Accounts</SelectItem>
          {accounts.map((account) => (
            <SelectItem key={account} value={account}>
              {account}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};


interface FolderFilterProps {
  folders: string[];
  selectedFolder: string | undefined;
  onFolderChange: (folder: string | undefined) => void;
}

export const FolderFilter: React.FC<FolderFilterProps> = ({
  folders,
  selectedFolder,
  onFolderChange,
}) => {
  const handleValueChange = (value: string) => {
    onFolderChange(value === 'all' ? undefined : value);
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="folder-filter" className="text-sm font-medium">Folder</label>
      <Select
        value={selectedFolder || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="folder-filter" className="w-[180px]">
          <SelectValue placeholder="Select folder" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Folders</SelectItem>
          {folders.map((folder) => (
            <SelectItem key={folder} value={folder}>
              {folder}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};