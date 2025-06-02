import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Updated list of E-commerce Categories
const ECOMMERCE_CATEGORIES = [
  "New Order",
  "Order Update",
  "Return Request",
  "Return Processed",
  "Refund Issued",
  "Customer Inquiry",
  "Platform Notification",
  "Payment Dispute/Chargeback",
  "Marketing/Promotions (from Platforms)",
  "Supplier/Logistics Communication",
  "Other",
];

interface CategoryFilterProps {
  selectedCategory: string | undefined;
  onCategoryChange: (category: string | undefined) => void;
  // Optional: if you want to dynamically populate categories from API response
  // availableCategories?: string[];
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onCategoryChange,
  // availableCategories // Uncomment if you decide to use dynamic categories
}) => {
  const handleValueChange = (value: string) => {
    onCategoryChange(value === 'all' ? undefined : value);
  };

  // Use availableCategories if provided, otherwise use the static list
  // const categoriesToDisplay = availableCategories && availableCategories.length > 0 
  //                             ? availableCategories 
  //                             : ECOMMERCE_CATEGORIES;
  // For now, sticking with the static list as per the original component's design.
  const categoriesToDisplay = ECOMMERCE_CATEGORIES;


  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="category-filter" className="text-sm font-medium">Category</label>
      <Select
        value={selectedCategory || 'all'} // If selectedCategory is undefined, 'all' is shown
        onValueChange={handleValueChange}
      >
        <SelectTrigger id="category-filter" className="w-full sm:w-[200px] md:w-[220px]"> {/* Made width responsive */}
          <SelectValue placeholder="Filter by category..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categoriesToDisplay.sort().map((category) => ( // Added .sort() for consistent order
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};