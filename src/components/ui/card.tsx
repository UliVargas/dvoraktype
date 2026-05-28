import { component$, Slot } from "@builder.io/qwik";

export interface CardProps {
  class?: string;
}

export const Card = component$<CardProps>((props) => {
  return (
    <div class={["brutal-card p-6", props.class].filter(Boolean).join(" ")}>
      <Slot />
    </div>
  );
});
