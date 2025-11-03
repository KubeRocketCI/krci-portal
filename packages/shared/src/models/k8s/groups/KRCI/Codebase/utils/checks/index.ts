import { codebaseType } from "../../constants";
import { Codebase } from "../../types";

export const isAutotest = (codebase: Codebase) => codebase.spec.type === codebaseType.autotest;
export const isLibrary = (codebase: Codebase) => codebase.spec.type === codebaseType.library;
export const isApplication = (codebase: Codebase) => codebase.spec.type === codebaseType.application;
export const isInfrastructure = (codebase: Codebase) => codebase.spec.type === codebaseType.infrastructure;
export const isSystem = (codebase: Codebase) => codebase.spec.type === codebaseType.system;
