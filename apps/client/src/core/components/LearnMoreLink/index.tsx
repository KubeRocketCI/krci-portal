export const LearnMoreLink = ({ url }: { url: string }) => {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
      <span className="text-sm">Learn more.</span>
    </a>
  );
};
