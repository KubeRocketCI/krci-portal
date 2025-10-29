import { Icon, Name, URL, Visible } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Name />
          </div>
          <div>
            <URL />
          </div>
          <div className="self-end">
            <Visible />
          </div>
        </div>
      </div>
      <div>
        <Icon />
      </div>
    </div>
  );
};
