import { BiHide } from "react-icons/bi";

interface Props {
  numberOfHiddenCols: number;
}

export default function HideFieldButton({ numberOfHiddenCols }: Props) {
  return (
    <div
      data-testid="hide-fields-button"
      className={`pointer flex h-6.5 flex-row items-center gap-1 rounded-xs border border-transparent p-2 text-[13px] ${
        numberOfHiddenCols > 0
          ? "bg-[#C4ECFF] text-gray-900 hover:border-2 hover:border-[#7FAFC4]"
          : "text-gray-500 hover:bg-gray-100"
      }`}
    >
      <BiHide />
      {numberOfHiddenCols === 0 ? (
        <span className="text-[13px]">Hide fields</span>
      ) : (
        <span className="text-[13px]">
          {numberOfHiddenCols} hidden field{numberOfHiddenCols > 1 && "s"}
        </span>
      )}
    </div>
  );
}
