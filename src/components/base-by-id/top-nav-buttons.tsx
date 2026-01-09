import { useLoadingStore } from "@/app/stores/use-loading-store";
import { useSavingStore } from "@/app/stores/use-saving-store";
import { SquareArrowOutUpRight, Wand2 } from "lucide-react";
import { LuLoaderPinwheel } from "react-icons/lu";
import { VscHistory } from "react-icons/vsc";
import { Button } from "../ui/button";

interface Props {
  colour: string;
}

export default function TopNavButtons({ colour }: Props) {
  const isSaving = useSavingStore((state) => state.isSaving);
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <div className="flex items-center gap-3">
      {isSaving && (
        <div className="flex flex-row gap-2 text-gray-500">
          <LuLoaderPinwheel size={16} className="animate-spin" />
          <p className="text-xs">Saving...</p>
        </div>
      )}
      {isLoading && (
        <div className="flex flex-row gap-2 text-gray-500">
          <LuLoaderPinwheel size={16} className="animate-spin" />
          <p className="text-xs">Loading...</p>
        </div>
      )}
      <div className="pointer flex flex-row gap-1 rounded-full hover:bg-gray-200">
        <button className="pointer flex flex-row gap-1 rounded px-2 py-2">
          <VscHistory size={16} />
        </button>
      </div>

      <Button
        variant="outline"
        className="pointer IC flex h-8 rounded-full border border-none border-gray-200 bg-gray-100 text-[13px] font-normal shadow-none hover:bg-gray-100"
      >
        <Wand2 size={14} className="text-gray-600" />
        Upgrade
      </Button>
      <Button
        variant="outline"
        className="pointer border-grey-900 IC flex h-8 rounded-md border bg-white text-[13px] font-normal shadow-none hover:bg-white hover:shadow-xs"
      >
        <SquareArrowOutUpRight size={14} className="text-gray-600" />
        Launch
      </Button>
      <Button
        className="pointer hover:none IC flex h-7 w-15 rounded-md border border-none shadow-none"
        style={{ backgroundColor: colour }}
      >
        Share
      </Button>

      {/* <AvatarLogOutDropdown user={user} /> */}
    </div>
  );
}
