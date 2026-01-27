import type { typeBaseWithTableIds } from "@/types/base";
import BaseCard from "./base-card";

interface Props {
  bases: typeBaseWithTableIds[];
}

export default function BasesGridView({ bases }: Props) {
  return (
    <div className="flex flex-row flex-wrap gap-4">
      {bases.map((base) => (
        <BaseCard key={`${base.id}-${base.isFavourite}`} base={base} />
      ))}
    </div>
  );
}
