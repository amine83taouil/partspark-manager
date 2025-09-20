import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, Category } from "@/types/inventory";

interface SearchFiltersProps {
  onSearch: (query: string, category?: Category, location?: string) => void;
  className?: string;
}

export function SearchFilters({ onSearch, className }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
  const [locationFilter, setLocationFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (
    query = searchQuery,
    category = selectedCategory,
    location = locationFilter
  ) => {
    onSearch(query, category, location);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(undefined);
    setLocationFilter("");
    onSearch("", undefined, "");
  };

  const hasActiveFilters = selectedCategory || locationFilter;

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, SKU, marque, fournisseur..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? "border-primary text-primary" : ""}
          >
            <Filter className="h-4 w-4" />
          </Button>
          
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="icon"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {showFilters && (
        <Card className="mb-4 animate-slide-up">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Catégorie</label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value: Category) => {
                    setSelectedCategory(value);
                    handleSearch(searchQuery, value, locationFilter);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les catégories" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Localisation</label>
                <Input
                  placeholder="Filtrer par localisation"
                  value={locationFilter}
                  onChange={(e) => {
                    setLocationFilter(e.target.value);
                    handleSearch(searchQuery, selectedCategory, e.target.value);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasActiveFilters && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              Catégorie: {selectedCategory}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setSelectedCategory(undefined);
                  handleSearch(searchQuery, undefined, locationFilter);
                }}
              />
            </Badge>
          )}
          {locationFilter && (
            <Badge variant="secondary" className="gap-1">
              Lieu: {locationFilter}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => {
                  setLocationFilter("");
                  handleSearch(searchQuery, selectedCategory, "");
                }}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
