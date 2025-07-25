import React, { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  buttonClass?: string;
}

export const Button = ({
  children,
  buttonClass = "px-2 py-1 bg-black text-white rounded-md hover:bg-gray-700 dark:bg-slate-400 dark:hover:bg-gray-600 cursor-pointer",
  ...props
}: ButtonProps) => {
  return (
    <button className={buttonClass} {...props}>
      {children}
    </button>
  );
};
