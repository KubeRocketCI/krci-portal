import { BorderedSectionProps } from './types';

export const BorderedSection = ({ title, children }: BorderedSectionProps) => {
  return (
    <div
      className="rounded shadow-md border-l-4 border-primary bg-card p-6"
    >
      <div className="flex flex-col gap-6">
        {title && typeof title === 'string' ? (
          <h3 className="text-xl font-semibold text-foreground">
            {title}
          </h3>
        ) : title ? (
          title
        ) : null}
        {children}
      </div>
    </div>
  );
};
