import { FieldEvent } from "@/core/types/forms";

export interface AdvancedJiraMappingRowProps {
  label: string;
  value: string;
  handleDeleteMappingRow(value: string): void;
  onChangeJiraPattern: (event: FieldEvent, value: string) => void;
}
