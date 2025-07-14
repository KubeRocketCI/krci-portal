// import { Stack, Tooltip } from "@mui/material";

export const PodsColumn = () => {
  //   const appName = appCodebase?.metadata.name;
  //   const appPods = applicationPodsMap?.[appName];
  //   const appPods = undefined;

  //   const disabled = (() => {
  //     if (!data?.argoApplication) {
  //       return {
  //         status: true,
  //         reason: "Could not find ArgoCD Application for this application",
  //       };
  //     }

  //     if (!appPods) {
  //       return {
  //         status: true,
  //         reason: "Could not find Pods for this application",
  //       };
  //     }

  //     return {
  //       status: false,
  //     };
  //   })();

  //   const buttonIconColor = disabled.status ? theme.palette.action.disabled : theme.palette.text.primary;

  //   return (
  //     <Stack direction="row" spacing={1} alignItems={"center"} justifyContent="center">
  //       <Tooltip title={disabled.status ? disabled.reason : "Show Logs"}>
  //         <div>
  //           <IconButton
  //             onClick={() =>
  //               setDialog(PodsLogViewerDialog, {
  //                 pods: appPods!,
  //               })
  //             }
  //             disabled={disabled.status || !appPods}
  //             size="large"
  //           >
  //             <Icon icon="ph:file-text-bold" color={buttonIconColor} width={20} height={20} />
  //           </IconButton>
  //         </div>
  //       </Tooltip>
  //       <Tooltip title={disabled.status ? disabled.reason : "Show Terminal"}>
  //         <div>
  //           <IconButton
  //             onClick={() =>
  //               setDialog(PodsTerminalDialog, {
  //                 pods: appPods!,
  //               })
  //             }
  //             disabled={disabled.status || !appPods}
  //             size="large"
  //           >
  //             <Icon icon="mdi:console" color={buttonIconColor} width={20} height={20} />
  //           </IconButton>
  //         </div>
  //       </Tooltip>
  //     </Stack>
  //   );
  return null;
};
