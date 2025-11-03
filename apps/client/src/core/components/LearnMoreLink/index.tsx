import { Link } from "@mui/material";

export const LearnMoreLink = ({ url }: { url: string }) => {
  return (
    <Link href={url} target={"_blank"}>
      <span className="text-sm">Learn more.</span>
    </Link>
  );
};
