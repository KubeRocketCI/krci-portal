import { CodebaseVersioning, Description, GitServer, GitUrlPath, Name, Private } from "../fields";
import { useUpdateVersioningFields } from "./hooks/useUpdateVersioningFields";

export const Form = () => {
  useUpdateVersioningFields();

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-4">
          <Name />
        </div>
        <div className="col-span-8">
          <Description />
        </div>
      </div>
      <div>
        <div className="grid grid-cols-12 gap-4 items-start">
          <div className="col-span-4">
            <GitServer />
          </div>
          <div className="col-span-8">
            <GitUrlPath />
          </div>
        </div>
      </div>
      <div>
        <Private />
      </div>
      <div>
        <CodebaseVersioning />
      </div>
    </div>
  );
};
