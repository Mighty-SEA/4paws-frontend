export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="bg-muted/40 h-24 animate-pulse rounded-md border" />
      <div className="bg-muted/40 h-[28rem] animate-pulse rounded-md border" />
    </div>
  );
}
