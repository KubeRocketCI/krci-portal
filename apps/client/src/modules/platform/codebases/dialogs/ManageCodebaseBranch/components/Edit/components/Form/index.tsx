import { BuildPipeline, ReviewPipeline } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <ReviewPipeline />
      </div>
      <div>
        <BuildPipeline />
      </div>
    </div>
  );
};
