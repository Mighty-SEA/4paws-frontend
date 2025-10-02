export default function Loading() {
  return (
    <div className="grid grid-cols-1 gap-4 p-4">
      <div className="flex items-center justify-end">
        <div className="bg-muted h-9 w-44 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted/40 h-96 animate-pulse rounded-md border" />
    </div>
  );
}
