import { BuildPipeline, ReviewPipeline, SecurityPipeline } from "../../../fields";

export function Form() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <ReviewPipeline />
      </div>
      <div>
        <BuildPipeline />
      </div>
      <div>
        <SecurityPipeline />
      </div>
    </div>
  );
}
