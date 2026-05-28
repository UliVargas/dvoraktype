import { component$, Slot, type QRL } from "@builder.io/qwik";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  onClick$?: QRL<() => void>;
  class?: string;
}

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-5 py-2.5 text-base",
  lg: "px-7 py-3.5 text-lg",
};

export const Button = component$<ButtonProps>((props) => {
  const { variant = "primary", size = "md", disabled = false } = props;

  const base =
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-100";

  const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary: "brutal-btn bg-primary text-primary-foreground",
    secondary: "brutal-btn bg-surface-card text-surface-dark",
    ghost:
      "rounded-brutal bg-transparent text-surface-dark hover:bg-surface-muted",
  };

  return (
    <button
      class={[
        base,
        sizeClasses[size],
        variantClasses[variant],
        disabled &&
          "opacity-50 cursor-not-allowed transform-none! shadow-brutal!",
        props.class,
      ]
        .filter(Boolean)
        .join(" ")}
      disabled={disabled}
      onClick$={props.onClick$}
    >
      <Slot />
    </button>
  );
});
