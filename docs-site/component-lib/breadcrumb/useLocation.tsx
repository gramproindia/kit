import { useEffect, useState, useMemo } from "react";

type Breadcrumb = {
  label: string;
  path: string;
};

type UseLocationProps = {
  showHome?: boolean;
  homeLabel?: string;
  rootPath?: string;
  transformLabel?: (segment: string) => string;
};

export function useLocation({
  showHome = true,
  homeLabel = "Home",
  rootPath = "/",
  transformLabel,
}: UseLocationProps) {
  const [pathSegments, setPathSegments] = useState<Breadcrumb[]>([]);
  const [mounted, setMounted] = useState(false);

  const labelTransformer = useMemo(() => {
    return (
      transformLabel ||
      ((segment: string) =>
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " "))
    );
  }, [transformLabel]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const generateBreadcrumbs = () => {
      const path = window.location.pathname;
      const segments = path.split("/").filter(Boolean);
      let finalPaths: Breadcrumb[] = [];

      if (showHome) {
        finalPaths.push({ label: homeLabel, path: rootPath });
      }

      let currentPath = "";
      segments.forEach((segment) => {
        currentPath += `/${segment}`;
        finalPaths.push({
          label: labelTransformer(segment),
          path: currentPath,
        });
      });

      setPathSegments(finalPaths);
    };

    generateBreadcrumbs();

    const handlePopState = () => {
      generateBreadcrumbs();
    };

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [mounted, showHome, homeLabel, rootPath, labelTransformer]);

  return { pathSegments };
}
