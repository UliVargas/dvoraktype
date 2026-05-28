import { component$ } from "@builder.io/qwik";

export const Footer = component$(() => {
  return (
    <footer class="border-t-2 border-border bg-surface-card py-6 mt-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center text-sm text-surface-dark/60 font-medium gap-4">
        <p>
          <span class="font-bold text-surface-dark">DvorakType</span> — Domina el teclado
          Dvorak en español
        </p>
        <div class="flex flex-wrap gap-4 items-center justify-center md:justify-end">
          <a
            href="/sugerencias"
            class="font-bold hover:text-primary transition-colors underline decoration-2 underline-offset-2"
          >
            Buzón de Sugerencias
          </a>
          <span>
            Hecho con ❤️ por{" "}
            <a
              href="https://github.com/ulivargas"
              target="_blank"
              rel="noopener noreferrer"
              class="font-bold hover:text-primary transition-colors underline decoration-2 underline-offset-2"
            >
              Ulises Vargas
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
});
