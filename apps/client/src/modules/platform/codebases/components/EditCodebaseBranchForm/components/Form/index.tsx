import { BuildPipeline, ReviewPipeline, SecurityPipeline } from "../fields";

interface FormProps {
  pipelines: {
    build?: string;
    review?: string;
    security?: string;
  };
}

export function Form({ pipelines }: FormProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <ReviewPipeline defaultPipeline={pipelines.review} />
      </div>
      <div>
        <BuildPipeline defaultPipeline={pipelines.build} />
      </div>
      <div>
        <SecurityPipeline defaultPipeline={pipelines.security} />
      </div>
    </div>
  );
}
