import { ValueOf } from "@/core/types/global";
import { CODEBASE_COMMON_LANGUAGES } from "./index";
import { ApplicationMapping } from "./application";
import { AutotestMapping } from "./autotest";
import { InfrastructureMapping } from "./infrastructure";
import { LibraryMapping } from "./library";
import { SystemMapping } from "./system";

export interface CodebaseMappingItemInterface {
  name: string;
  value: string;
  icon?: string;
}

export interface CodebaseInterface {
  language: CodebaseMappingItemInterface;
  frameworks: Record<string, CodebaseMappingItemInterface>;
  buildTools: Record<string, CodebaseMappingItemInterface>;
  autoTestReportFrameworks?: Record<string, CodebaseMappingItemInterface>;
}

export type CodebaseMappingKey = ValueOf<typeof CODEBASE_COMMON_LANGUAGES>;
export type CodebaseMapping =
  | ApplicationMapping
  | LibraryMapping
  | AutotestMapping
  | InfrastructureMapping
  | SystemMapping
  | null;
