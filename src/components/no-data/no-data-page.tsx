interface Props {
  missingData: string;
}

export default function NoDataPage({ missingData }: Props) {
  return (
    <div className="IC flex h-full">
      <p>No {missingData} found in this page</p>
    </div>
  );
}
