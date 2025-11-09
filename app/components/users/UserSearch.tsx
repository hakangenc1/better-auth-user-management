import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Card, CardContent } from "~/components/ui/card";
import { Search, X, Download, Filter } from "lucide-react";
import type { SearchFilters } from "~/types";

interface UserSearchProps {
  onSearch: (filters: SearchFilters) => void;
  onExport: () => void;
  totalResults: number;
}

export function UserSearch({ onSearch, onExport, totalResults }: UserSearchProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    role: "all",
    status: "all",
  });

  const handleSearch = () => {
    onSearch(filters);
  };

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      query: "",
      role: "all",
      status: "all",
    };
    setFilters(clearedFilters);
    onSearch(clearedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={filters.query}
            onChange={(e) => setFilters({ ...filters, query: e.target.value })}
            onKeyPress={handleKeyPress}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        <Button variant="outline" onClick={onExport}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {showFilters && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={filters.role}
                  onValueChange={(value) => setFilters({ ...filters, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters({ ...filters, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending Verification</SelectItem>
                    <SelectItem value="banned">Banned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={filters.dateFrom ? filters.dateFrom.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                  <Input
                    type="date"
                    value={filters.dateTo ? filters.dateTo.toISOString().split("T")[0] : ""}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        dateTo: e.target.value ? new Date(e.target.value) : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <p className="text-sm text-muted-foreground">
                {totalResults} {totalResults === 1 ? "result" : "results"} found
              </p>
              <Button variant="ghost" onClick={handleClear}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
