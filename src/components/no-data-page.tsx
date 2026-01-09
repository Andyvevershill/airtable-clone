import { useLoadingStore } from "@/app/stores/use-loading-store";

interface Props {
  missingData: string;
}

export default function NoDataPage({ missingData }: Props) {
  const setIsLoading = useLoadingStore((state) => state.setIsLoading);
  setIsLoading(false);
  return (
    <div className="IC flex h-full">
      <p>No {missingData} found in this page</p>
    </div>
  );
}
