import { useId } from "react";

type ToggleProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export default function Toggle({
  checked,
  onChange,
  disabled = false,
}: ToggleProps) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center"
      onClick={(e) => e.stopPropagation()} // prevent row double-toggle
    >
      <input
        id={id}
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />

      {/* Track */}
      <div className="relative h-2.5 w-4 rounded-full bg-gray-200 transition-colors peer-checked:bg-green-700">
        {/* Thumb */}
        <div className="absolute top-1/2 left-[1px] h-2 w-2 -translate-y-1/2 rounded-full bg-white transition-transform peer-checked:translate-x-1.5" />
      </div>
    </label>
  );
}
