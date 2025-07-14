import { Icon } from '@iconify/react';
import { Box, Stack, Tooltip, useTheme } from '@mui/material';
import React from 'react';
import { useFormContext } from 'react-hook-form';
import { ICONS } from '../../../../../../icons/iconify-icons-mapping';
import { FormSwitch } from '../../../../../../providers/Form/components/FormSwitch';
import {
  ALL_VALUES_OVERRIDE_KEY,
  APPLICATIONS_TABLE_MODE,
  VALUES_OVERRIDE_POSTFIX,
} from '../../../../constants';
import { ValuesOverrideSwitchProps } from './types';

export const ValuesOverrideSwitch = ({
  enrichedApplicationWithArgoApplication,
  mode,
}: ValuesOverrideSwitchProps) => {
  const theme = useTheme();
  const { application, argoApplication } = enrichedApplicationWithArgoApplication;
  const {
    control,
    formState: { errors },
    register,
    setValue,
    getValues,
    watch,
  } = useFormContext();

  

  return (
    
  );
};
