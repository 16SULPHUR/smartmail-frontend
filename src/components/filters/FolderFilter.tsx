import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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