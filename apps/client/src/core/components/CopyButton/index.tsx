import { Box, Button } from "@mui/material";
import { Copy, CopyCheck } from "lucide-react";
import React from "react";

export const CopyButton = ({ text, size = "small" }: { text: string; size?: "medium" | "small" }) => {
  const iconSize = size === "medium" ? 20 : 15;

  const [showCopied, setShowCopied] = React.useState<boolean>(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleClickCopy = () => {
    navigator.clipboard.writeText(text);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setShowCopied(true);
    timeoutRef.current = setTimeout(() => {
      setShowCopied(false);
    }, 2000);
  };

  return (
    <Box sx={{ color: "text.secondary", pt: "0.4%" }}>
      <Button
        onClick={handleClickCopy}
        sx={{ minWidth: 0, p: (t) => t.typography.pxToRem(iconSize / 2.5) }}
        color="inherit"
      >
        {showCopied ? <CopyCheck size={iconSize} /> : <Copy size={iconSize} />}
      </Button>
    </Box>
  );
};
