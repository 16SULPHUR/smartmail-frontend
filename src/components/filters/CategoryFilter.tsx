// src/components/filters/CategoryFilter.tsx
import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; 

// Default list if availableCategories is not provided or empty
const DEFAULT_FALLBACK_CATEGORIES = [
  "New Order", "Order Update", "Return Request", "Refund Issued",
  "Customer Inquiry", "Platform Notification", "Other",
];

interface CategoryFilterProps {
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  availableCategories?: string[]; // MODIFIED: Make this prop optional
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  availableCategories,
}) => {
  const handleValueChange = (value: string) => {
    onCategoryChange(value === 'all' ? undefined : value);
  };

  const categoriesToDisplay = 
    availableCategories && availableCategories.length > 0 
      ? availableCategories 
      : DEFAULT_FALLBACK_CATEGORIES; // Use fallback if dynamic list is empty or not provided

  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="category-filter" className="text-sm font-medium">Category</label>
      <Select
        value={selectedCategory || 'all'}
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="category-filter" className="w-full sm:w-[200px] md:w-[220px]">
          <SelectValue placeholder="Filter by category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categoriesToDisplay.sort().map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};