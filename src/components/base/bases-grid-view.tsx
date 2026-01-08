import type { Base } from "@/types/bases";
import BaseCard from "./base-card";

interface Props {
  bases: Base[];
}

export default function BasesGridView({ bases }: Props) {
  return (
    <div className="flex flex-row gap-4">
      {bases.map((base) => (
        <BaseCard key={base.id} base={base} />
      ))}
    </div>
  );
}
