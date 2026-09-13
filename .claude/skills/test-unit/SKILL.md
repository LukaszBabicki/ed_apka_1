---
name: test-unit
description: Use this skill when the user asks to generate, write, or add unit tests using Vitest for TypeScript/JavaScript code in this project — whether pasted directly or referenced by file path. Triggers include "napisz testy", "wygeneruj testy", "dodaj testy jednostkowe", "write tests", "unit tests", "pokryj testami", and any request to cover a specific function, module, or file with tests. Accepts an optional file path as $ARGUMENTS.
---

Wygeneruj testy jednostkowe z Vitest dla: $ARGUMENTS (jeśli nie podano ścieżki, zapytaj o plik lub kod do przetestowania).

Zasady specyficzne dla tego projektu (zgodnie z CLAUDE.md i vitest.config.mts):
- globals: true jest włączone — nie importuj describe/it/expect/vi, są dostępne automatycznie
- Dla komponentów renderowanych: matchery z @testing-library/jest-dom są już załadowane (vitest.setup.ts, environment: jsdom)
- Plik testowy obok źródłowego, sufiks .test.ts / .test.tsx
- Testuj happy path + edge case'y (pusta lista, brakujące pole, nieprawidłowy status/enum)
- Mockuj zależności zewnętrzne przez vi.mock() — szczególnie fs w lib/flights.ts, nie testuj bezpośrednio zapisu do prawdziwych plików
- Nazwy testów po polsku, opisowe
- Min. 3 testy na funkcję/komponent publiczny

Po wygenerowaniu uruchom npm run typecheck, żeby potwierdzić że nowy plik się kompiluje.
