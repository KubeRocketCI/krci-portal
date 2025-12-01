export interface AdvancedJiraMappingRowProps {
  label: string;
  field: string;
  index: number;
  onDelete: (index: number) => void;
  onPatternChange?: () => void;
}
