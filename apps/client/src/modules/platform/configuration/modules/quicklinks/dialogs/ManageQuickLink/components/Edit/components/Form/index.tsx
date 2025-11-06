import { Icon, URL, Visible } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-4">
      <URL />
      <Icon />
      <Visible />
    </div>
  );
};
