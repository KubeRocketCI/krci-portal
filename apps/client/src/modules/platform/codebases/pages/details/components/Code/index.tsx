import { SubSection } from "@/core/components/SubSection";
import { PullRequestList } from "./components/PullRequestList";

export function Code() {
  return (
    <SubSection
      title={
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">Pull Requests</h1>
        </div>
      }
    >
      <PullRequestList />
    </SubSection>
  );
}
