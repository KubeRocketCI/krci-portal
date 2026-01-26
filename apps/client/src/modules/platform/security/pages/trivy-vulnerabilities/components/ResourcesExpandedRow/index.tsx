import { ImageResource } from "../../types";

interface ResourcesExpandedRowProps {
  resources: ImageResource[];
}

/**
 * Expanded row content showing where an image is used.
 * Displays a table of resources (Kind, Name, Container) using the image.
 */
export function ResourcesExpandedRow({ resources }: ResourcesExpandedRowProps) {
  if (!resources || resources.length === 0) {
    return <div className="text-muted-foreground py-4 text-center text-sm">No resources found</div>;
  }

  return (
    <div className="bg-muted/30 px-4 py-3">
      <div className="mb-2 text-sm font-medium">Used in {resources.length} resource(s):</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b">
            <th className="text-muted-foreground px-2 py-1.5 text-left font-medium">Resource</th>
            <th className="text-muted-foreground px-2 py-1.5 text-left font-medium">Kind</th>
            <th className="text-muted-foreground px-2 py-1.5 text-left font-medium">Container</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((resource, index) => (
            <tr
              key={`${resource.kind}-${resource.name}-${resource.containerName}-${index}`}
              className="border-border border-b last:border-b-0"
            >
              <td className="px-2 py-1.5">{resource.name || "-"}</td>
              <td className="text-muted-foreground px-2 py-1.5">{resource.kind || "-"}</td>
              <td className="px-2 py-1.5">{resource.containerName || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
