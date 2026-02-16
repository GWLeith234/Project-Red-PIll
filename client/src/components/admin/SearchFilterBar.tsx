import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";

interface FilterOption {
  label: string;
  options: { label: string; value: string }[];
}

interface SearchFilterBarProps {
  onSearch: (query: string) => void;
  filters?: FilterOption[];
  onFilterChange?: (filterLabel: string, value: string) => void;
  placeholder?: string;
}

export default function SearchFilterBar({ onSearch, filters, onFilterChange, placeholder = "Search..." }: SearchFilterBarProps) {
  const [query, setQuery] = useState("");

  const debouncedSearch = useCallback(() => {
    const timer = setTimeout(() => onSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    return debouncedSearch();
  }, [debouncedSearch]);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2" data-testid="search-filter-bar">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          data-testid="input-search"
        />
      </div>
      {filters?.map((filter, i) => (
        <select
          key={i}
          onChange={(e) => onFilterChange?.(filter.label, e.target.value)}
          className="px-3 py-2 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          data-testid={`select-filter-${i}`}
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
