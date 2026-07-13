"use client";

import { CSSProperties, ReactNode } from "react";

// A submit button that asks for confirmation before letting its form submit.
// Lets the admin page stay a server component (its destructive actions are
// plain <form action={serverAction}> posts) while still gating the truly
// irreversible ones — Archive, Remove, Delete account — behind a native
// confirm() dialog, so they can't fire on a mis-click.
export function ConfirmSubmitButton({
  message,
  className,
  style,
  children,
}: {
  message: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      className={className}
      style={style}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
