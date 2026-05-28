import { component$ } from "@builder.io/qwik";

export interface LogoIconProps {
  class?: string;
}

export const LogoIcon = component$<LogoIconProps>((props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      class={props.class}
    >
      <path
        fill="currentColor"
        fill-rule="evenodd"
        clip-rule="evenodd"
        d="M2 2h20v20H2zM8 6v12h4.5c3.5 0 6-2.5 6-6s-2.5-6-6-6H8zm3 3v6h1.5c1.5 0 2.5-1 2.5-3s-1-2-2.5-3H11z"
      />
    </svg>
  );
});
