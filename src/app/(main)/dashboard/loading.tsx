export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="bg-muted h-10 w-48 animate-pulse rounded-md" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-muted/40 h-40 animate-pulse rounded-md border" />
        <div className="bg-muted/40 h-40 animate-pulse rounded-md border" />
      </div>
      <div className="bg-muted/40 h-96 animate-pulse rounded-md border" />
    </div>
  );
}
