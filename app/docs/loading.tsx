
export default function Loading() {
  return (
    <div className="flex-1 max-w-4xl mx-auto py-12 px-6 animate-pulse">
      {/* Breadcrumb skeleton */}
      <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
      
      {/* Title skeleton */}
      <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
      
      {/* Content paragraphs */}
      <div className="space-y-4">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-5/6"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-4/6"></div>
      </div>
      
      {/* Subheader skeleton */}
      <div className="h-8 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded mt-12 mb-6"></div>
      
      {/* More content */}
      <div className="space-y-4">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full"></div>
        <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-11/12"></div>
      </div>
    </div>
  );
}
