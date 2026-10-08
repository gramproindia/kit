"use client";

import { Skeleton } from "@/components/skeleton";

export default function SkeletonShapesWrapper() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton variant="circle" width={40} />
      <div className="flex-1">
        <Skeleton lines={2} />
      </div>
      <Skeleton variant="rect" width={120} height={60} animation="wave" />
    </div>
  );
}
