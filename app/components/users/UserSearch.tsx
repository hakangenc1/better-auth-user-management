import { useMemo, useState, useCallback } from "react";
import type { SearchFilters } from "~/types";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Filter, Download, Search, X } from "lucide-react";

interface UserSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onExport: () => void;
  totalResults: number;
}

export function UserSearch({ onSearch, onExport, totalResults }: UserSearchProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    role: "all",
    status: "all",
  });
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const handleSearch = useCallback(() => {
    onSearch(filters);
  }, [filters, onSearch]);

  const updateFilters = useCallback((partial: Partial<SearchFilters>) => {
    setFilters((prev) => {
      return { ...prev, ...partial };
    });
  }, []);

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      role: "all",
      status: "all",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
    setIsFilterMenuOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 backdrop-blur">
      <div className="relative flex-1 min-w-[200px] sm:min-w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Quick search…"
          value={filters.query}
          onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
          onKeyDown={handleKeyDown}
          className="pl-9"
        />
      </div>

      <Button variant="secondary" size="sm" onClick={handleSearch} className="gap-1.5">
        <Search className="h-4 w-4" />
        Search
      </Button>

      <DropdownMenu open={isFilterMenuOpen} onOpenChange={setIsFilterMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Filter className="h-4 w-4" />
            Filters
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 space-y-4 p-4" align="start">
          <div className="grid gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
              Role
            </Label>
            <Select
              value={filters.role}
              onValueChange={(value) => {
                updateFilters({ role: value });
                onSearch({ ...filters, role: value });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground/80">
              Status
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) => {
                updateFilters({ status: value as SearchFilters["status"] });
                onSearch({ ...filters, status: value as SearchFilters["status"] });
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1.5">
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="outline" size="sm" onClick={onExport} className="gap-1.5">
        <Download className="h-4 w-4" />
        Export
      </Button>

      <Badge variant="secondary" className="ml-auto flex items-center gap-1 font-medium">
        <span>{totalResults}</span>
        <span className="text-xs uppercase tracking-wide text-muted-foreground/80">
          {totalResults === 1 ? "match" : "matches"}
        </span>
      </Badge>
    </div>
  );
}
