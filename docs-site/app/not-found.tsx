import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-8xl font-bold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500 bg-clip-text text-transparent mb-6">
        404
      </h1>
      <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200 mb-4">
        Page Not Found
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 max-w-md mb-8">
        Oops! The page you're looking for doesn't exist. It might have been
        moved or deleted.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-medium hover:opacity-90 transition-opacity"
      >
        Go back to home
      </Link>
    </div>
  );
}
