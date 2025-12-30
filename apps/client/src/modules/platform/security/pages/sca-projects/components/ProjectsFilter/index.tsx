import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { Search } from "lucide-react";

interface ProjectsFilterProps {
  searchTerm: string;
  onSearchChange: (searchTerm: string) => void;
}

/**
 * Filter component for SCA Projects table
 * Provides server-side search across all projects
 */
export function ProjectsFilter({ searchTerm, onSearchChange }: ProjectsFilterProps) {
  return (
    <div className="col-span-6">
      <Label htmlFor="search">Search</Label>
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          id="search"
          type="text"
          placeholder="Search projects by name or version..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
