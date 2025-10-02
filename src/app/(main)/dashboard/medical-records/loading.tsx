export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="bg-muted h-10 w-64 animate-pulse rounded-md" />
      <div className="bg-muted/40 h-[28rem] animate-pulse rounded-md border" />
    </div>
  );
}
