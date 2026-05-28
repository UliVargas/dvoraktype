import { component$, useSignal, useContext } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { LuSun, LuMoon } from "@qwikest/icons/lucide";
import { LogoIcon } from "./logo-icon";
import {
  LayoutVariantContext,
  ThemeContext,
  LayoutActionContext,
} from "../../context/layout-context";

export const Header = component$(() => {
  const loc = useLocation();
  const currentVariant = useContext(LayoutVariantContext);
  const isDarkMode = useContext(ThemeContext);
  const actions = useContext(LayoutActionContext);

  const isLayoutDropdownOpen = useSignal(false);

  const isLearning =
    loc.url.pathname === "/" || loc.url.pathname.startsWith("/leccion");
  const isPractice = loc.url.pathname.startsWith("/practica");

  return (
    <header class="border-b-2 border-border bg-surface-card">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" class="flex items-center gap-3 group">
          <div class="w-10 h-10 bg-primary rounded-brutal border-2 border-border shadow-brutal-sm flex items-center justify-center transition-all group-hover:translate-x-px group-hover:translate-y-px group-hover:shadow-brutal-pressed">
            <LogoIcon class="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 class="text-xl font-extrabold tracking-tight text-surface-dark leading-none">
              Dvorak<span class="text-primary">Type</span>
            </h1>
            <p class="text-xs text-surface-dark/60 font-medium">
              Domina el Teclado Dvorak
            </p>
          </div>
        </Link>

        <nav class="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Link
            href="/"
            class={`text-sm font-bold transition-all px-3 py-1.5 rounded-brutal-sm border-2 ${
              isLearning
                ? "bg-primary text-primary-foreground border-border shadow-brutal-sm"
                : "text-surface-dark/70 border-transparent hover:border-border hover:bg-surface-muted"
            }`}
          >
            Aprendizaje
          </Link>

          <Link
            href="/practica"
            class={`text-sm font-bold transition-all px-3 py-1.5 rounded-brutal-sm border-2 ${
              isPractice
                ? "bg-primary text-primary-foreground border-border shadow-brutal-sm"
                : "text-surface-dark/70 border-transparent hover:border-border hover:bg-surface-muted"
            }`}
          >
            Práctica Libre
          </Link>

          <Link
            href="/sugerencias"
            class={`text-sm font-bold transition-all px-3 py-1.5 rounded-brutal-sm border-2 ${
              loc.url.pathname.startsWith("/sugerencias")
                ? "bg-primary text-primary-foreground border-border shadow-brutal-sm"
                : "text-surface-dark/70 border-transparent hover:border-border hover:bg-surface-muted"
            }`}
          >
            Sugerencias
          </Link>

          {/* Selector de Layout — Brutalist */}
          <div
            class="relative"
            onFocusOut$={() => {
              setTimeout(() => {
                isLayoutDropdownOpen.value = false;
              }, 150);
            }}
            tabIndex={-1}
          >
            <button
              type="button"
              onClick$={() =>
                (isLayoutDropdownOpen.value = !isLayoutDropdownOpen.value)
              }
              class="border-2 border-border shadow-brutal-sm rounded-brutal-sm px-3 py-1.5 text-sm font-bold bg-surface-card text-surface-dark cursor-pointer transition-all hover:translate-x-px hover:translate-y-px hover:shadow-brutal-pressed focus:outline-none flex items-center justify-between min-w-50"
            >
              <span>
                {currentVariant.value === "es-dvorak-xkb"
                  ? "Dvorak Español"
                  : "Dvorak US Internacional"}
              </span>
              <span class="text-[10px] ml-2 opacity-70">▼</span>
            </button>

            {isLayoutDropdownOpen.value && (
              <div class="absolute top-full right-0 mt-2 w-full border-2 border-border shadow-brutal rounded-brutal-sm bg-surface-card overflow-hidden z-50 animate-fade-in flex flex-col">
                <button
                  type="button"
                  class={`text-left px-3 py-2.5 text-sm font-bold hover:bg-surface-muted transition-colors ${currentVariant.value === "es-dvorak-xkb" ? "bg-primary text-primary-foreground hover:bg-primary-dark" : "text-surface-dark"}`}
                  onClick$={() => {
                    actions.changeLayout$("es-dvorak-xkb");
                    isLayoutDropdownOpen.value = false;
                  }}
                >
                  Dvorak Español
                </button>
                <div class="w-full h-0.5 bg-border opacity-20"></div>
                <button
                  type="button"
                  class={`text-left px-3 py-2.5 text-sm font-bold hover:bg-surface-muted transition-colors ${currentVariant.value === "us-dvorak-intl" ? "bg-primary text-primary-foreground hover:bg-primary-dark" : "text-surface-dark"}`}
                  onClick$={() => {
                    actions.changeLayout$("us-dvorak-intl");
                    isLayoutDropdownOpen.value = false;
                  }}
                >
                  Dvorak US Int.
                </button>
              </div>
            )}
          </div>

          {/* Selector de Tema — Switch Brutalist */}
          <div class="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick$={actions.toggleTheme$}
              class="relative flex items-center w-16 h-8 rounded-brutal-sm border-2 border-border bg-surface-card shadow-brutal-sm cursor-pointer hover:translate-x-px hover:translate-y-px hover:shadow-brutal-pressed transition-all overflow-hidden"
              aria-label="Alternar Tema"
            >
              <div
                class={`absolute w-6 h-6 rounded-sm border-2 border-border bg-primary transition-transform duration-200 ease-out flex items-center justify-center text-primary-foreground top-0.5 left-0.5 ${
                  isDarkMode.value ? "translate-x-8" : "translate-x-0"
                }`}
              >
                {isDarkMode.value ? (
                  <LuMoon class="w-4 h-4" />
                ) : (
                  <LuSun class="w-4 h-4" />
                )}
              </div>
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
});
