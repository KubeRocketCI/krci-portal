import { Applications, Description } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-10">
      <Description />
      <Applications />
    </div>
  );
};
