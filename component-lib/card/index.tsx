import React, { ReactNode } from "react";

interface CardProps {
  children?: ReactNode;
  cardClass?: string;
}

export function Card({
  children,
  cardClass = "shadow-md rounded-xl p-4 border border-gray-400",
}: CardProps) {
  return <div className={cardClass}>{children}</div>;
}
