export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div className="bg-muted h-8 w-56 animate-pulse rounded-md" />
        <div className="bg-muted h-9 w-40 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted/40 h-52 animate-pulse rounded-md border" />
      <div className="bg-muted/40 h-[28rem] animate-pulse rounded-md border" />
      <div className="bg-muted/40 h-64 animate-pulse rounded-md border" />
    </div>
  );
}
