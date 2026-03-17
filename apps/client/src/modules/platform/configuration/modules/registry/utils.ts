export const satisfiesType = (registryType: string, allowedTypes: string[]): boolean => {
  return !!registryType && allowedTypes.includes(registryType);
};
