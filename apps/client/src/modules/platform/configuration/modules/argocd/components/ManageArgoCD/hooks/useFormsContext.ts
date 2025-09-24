import { useMultiFormContext } from '@/core/providers/MultiForm/hooks';
import { FormNames } from '../types';

export const useFormsContext = () => useMultiFormContext<FormNames>();
