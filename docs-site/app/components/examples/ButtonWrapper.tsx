import { Button } from "@/legacy-components/button";

export const ButtonWrapper = () => {
  return (
    <div className="flex gap-4">
      <Button>Click Me!</Button>
      <Button className="bg-red-800 px-2 py-1 rounded-2xl cursor-pointer">
        Click Me!
      </Button>
      <Button className="border px-2 py-1 rounded-2xl cursor-pointer">
        Click Me!
      </Button>
    </div>
  );
};
