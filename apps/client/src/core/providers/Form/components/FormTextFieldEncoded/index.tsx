// import { ErrorMessage } from '@hookform/error-message';
// import { Icon } from '@iconify/react';
// import {
//   FormControl,
//   IconButton,
//   InputAdornment,
//   TextField,
//   Tooltip,
//   useTheme,
// } from '@mui/material';
// import React from 'react';
// import { Controller } from 'react-hook-form';
// import { ICONS } from '../../../../icons/iconify-icons-mapping';
// import { FormTextFieldProps } from './types';

// export const FormTextFieldEncoded = React.forwardRef(
//   (
//     {
//       name,
//       label,
//       title,
//       control,
//       defaultValue = '',
//       errors,
//       placeholder,
//       disabled = false,
//       InputProps,
//       TextFieldProps,
//       ...props
//     }: FormTextFieldProps,
//     ref: React.ForwardedRef<HTMLInputElement>
//   ) => {
//     const theme = useTheme();
//     const hasError = !!errors[name];

//     const [hidden, setHidden] = React.useState<boolean>(true);

//     const _InputProps = React.useMemo(
//       () => ({
//         ...InputProps,
//         endAdornment: (
//           <div className="flex flex-row gap-2">
//             {title && (
//               <InputAdornment position="end">
//                 <Tooltip title={title}>
//                   <Icon icon={ICONS.INFO_CIRCLE} width={15} color={theme.palette.action.active} />
//                 </Tooltip>
//               </InputAdornment>
//             )}
//             <InputAdornment position="end">
//               <IconButton size={'small'} onClick={() => setHidden((prev) => !prev)}>
//                 <Icon icon={hidden ? ICONS.PENCIL : ICONS.CROSS} />
//               </IconButton>
//             </InputAdornment>
//           </div>
//         ),
//       }),
//       [InputProps, hidden, theme.palette.action.active, title]
//     );

//     const disabledInputRef = React.useRef(null);

//     return (
//       <div className="flex flex-col gap-2">
//         <FormControl fullWidth>
//           {!hidden ? (
//             <Controller
//               render={({ field }) => {
//                 return (
//                   <TextField
//                     error={hasError}
//                     placeholder={placeholder}
//                     inputRef={ref}
//                     disabled={disabled}
//                     InputProps={_InputProps}
//                     label={label}
//                     {...field}
//                     {...TextFieldProps}
//                   />
//                 );
//               }}
//               name={name}
//               defaultValue={defaultValue}
//               control={control}
//               {...props}
//             />
//           ) : (
//             <TextField
//               error={hasError}
//               placeholder={placeholder}
//               inputRef={disabledInputRef}
//               label={label}
//               disabled
//               value={'••••••••'}
//               InputProps={_InputProps}
//               {...TextFieldProps}
//             />
//           )}
//         </FormControl>
//         {hasError && (
//           <span className="text-sm font-medium text-destructive">
//             <ErrorMessage errors={errors} name={name} />
//           </span>
//         )}
//       </div>
//     );
//   }
// );
