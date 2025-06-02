import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (newPageSize: number) => void;
  availableSizes?: number[];
}

const DEFAULT_SIZES = [10, 15, 25, 50, 100];

export const PageSizeSelector: React.FC<PageSizeSelectorProps> = ({
  pageSize,
  onPageSizeChange,
  availableSizes = DEFAULT_SIZES,
}) => {
  return (
    <div className="space-y-1">
      <Label htmlFor="pageSizeSelect">Emails per page</Label>
      <Select
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <SelectTrigger id="pageSizeSelect" className="w-full">
          <SelectValue placeholder="Select page size" />
        </SelectTrigger>
        <SelectContent>
          {availableSizes.map((size) => (
            <SelectItem key={size} value={String(size)}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};