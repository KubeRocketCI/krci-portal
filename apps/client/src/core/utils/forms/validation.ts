import { ValidationRule } from "../../constants/validation";

export const validateField = (value: string, rules: ValidationRule[]) => {
  const ruleViolation = rules.find((rule) => !rule.pattern.test(value));
  return ruleViolation ? ruleViolation.message : true;
};
