import { Icon, Name, URL, Visible } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-4">
      <Name />
      <URL />
      <Icon />
      <Visible />
    </div>
  );
};
