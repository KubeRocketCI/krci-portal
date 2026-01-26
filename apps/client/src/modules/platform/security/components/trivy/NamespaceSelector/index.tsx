import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/core/components/ui/select";
import { Label } from "@/core/components/ui/label";

export interface NamespaceSelectorProps {
  /**
   * Currently selected namespace
   */
  value: string;
  /**
   * Callback when namespace selection changes
   */
  onChange: (namespace: string) => void;
  /**
   * List of namespaces to display in the dropdown.
   * Should come from useDiscoverTrivyNamespaces hook.
   */
  namespaces: string[];
  /**
   * Whether the namespace list is still loading.
   */
  isLoading?: boolean;
}

/**
 * Namespace selector dropdown for Trivy security pages.
 * Displays namespaces either discovered from cluster-wide query (admins)
 * or from user's allowed namespaces configuration (limited users).
 * Always visible to indicate the feature exists, even with single namespace.
 */
export function NamespaceSelector({ value, onChange, namespaces, isLoading }: NamespaceSelectorProps) {
  // Ensure current value is in the list (fallback for edge cases)
  const namespaceOptions = namespaces.includes(value) ? namespaces : [value, ...namespaces];

  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="namespace-selector" className="text-muted-foreground text-sm">
        Namespace:
      </Label>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger id="namespace-selector" className="w-[200px]">
          <SelectValue placeholder={isLoading ? "Loading..." : "Select namespace"} />
        </SelectTrigger>
        <SelectContent>
          {namespaceOptions.map((ns) => (
            <SelectItem key={ns} value={ns}>
              {ns}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
