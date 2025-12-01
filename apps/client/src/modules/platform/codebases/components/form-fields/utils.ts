import { codebaseCreationStrategy } from "@my-project/shared";

export const isCloneStrategy = (strategyValue: string) => strategyValue === codebaseCreationStrategy.clone;
export const isImportStrategy = (strategyValue: string) => strategyValue === codebaseCreationStrategy.import;

