import { Link, Typography } from "@mui/material";

export const LearnMoreLink = ({ url }: { url: string }) => {
  return (
    <Link href={url} target={"_blank"}>
      <Typography variant={"body2"} component={"span"}>
        Learn more.
      </Typography>
    </Link>
  );
};
