import { BorderedSectionProps } from "./types";

export const BorderedSection = ({ title, children }: BorderedSectionProps) => {
  return (
    <div className="border-primary bg-card rounded border-l-4 p-6 shadow-md">
      <div className="flex flex-col gap-6">
        {title && typeof title === "string" ? (
          <h3 className="text-foreground text-xl font-semibold">{title}</h3>
        ) : title ? (
          title
        ) : null}
        {children}
      </div>
    </div>
  );
};
