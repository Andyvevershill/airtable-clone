interface Props {
  colour: string;
}

const tabs = ["Data", "Automations", "Interfaces", "Forms"];

export default function TopNavTabs({ colour }: Props) {
  return (
    <div className="relative flex h-20 w-full flex-row items-end gap-4">
      {tabs.map((tab) => (
        <div
          key={tab}
          className="pointer mb-3 pb-4 text-[13px] font-normal text-gray-600 hover:text-gray-950"
          style={
            tab === "Data"
              ? {
                  color: "#030712",
                  borderBottom: `2px solid ${colour}`,
                  marginBottom: "11px",
                }
              : {}
          }
        >
          {tab}
        </div>
      ))}
    </div>
  );
}
