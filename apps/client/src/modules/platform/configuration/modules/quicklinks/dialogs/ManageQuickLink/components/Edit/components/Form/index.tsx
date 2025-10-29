import { Icon, URL, Visible } from "../../../fields";

export const Form = () => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <URL />
          </div>
          <div className="col-span-1 self-end">
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
