import { useSavingStore } from "@/app/stores/use-saving-store";
import { api } from "@/trpc/react";
import type { typeBaseWithTableIds } from "@/types/base";
import { useRouter } from "next/navigation";
import { BiCoinStack } from "react-icons/bi";
import { Input } from "../ui/input";

interface Props {
  base: typeBaseWithTableIds;
  nameState: [string, React.Dispatch<React.SetStateAction<string>>];
  setEditMode: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function BaseEditMode({ base, nameState, setEditMode }: Props) {
  const router = useRouter();
  const setIsSaving = useSavingStore((state) => state.setIsSaving);
  const [baseName, setBaseName] = nameState;

  const renameBase = api.base.updateNameById.useMutation({
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: () => {
      router.refresh();
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const handleSave = () => {
    if (baseName.trim() && baseName.trim() !== base.name) {
      setBaseName(baseName.trim());
      renameBase.mutate({
        baseId: base.id,
        name: baseName.trim(),
      });
    }
    setEditMode(false);
  };

  const handleRenameSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <Input
        type="text"
        value={baseName}
        onChange={(e) => setBaseName(e.target.value)}
        onKeyDown={handleRenameSubmit}
        onBlur={() => handleSave()}
        placeholder="Base name"
        className="text-md mb-1 h-8 w-51 rounded-md border-2 border-blue-500 bg-transparent text-sm shadow-xs hover:bg-white focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-0"
        autoFocus
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex items-center">
        <BiCoinStack />
        <p className="ml-2.5 text-xs text-gray-500">Open data</p>
      </div>
    </div>
  );
}
