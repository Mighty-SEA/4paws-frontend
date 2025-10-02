export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="bg-muted h-10 w-56 animate-pulse rounded-md" />
      <div className="bg-muted/40 h-96 animate-pulse rounded-md border" />
    </div>
  );
}
