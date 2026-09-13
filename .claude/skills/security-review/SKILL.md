---
name: security-review
description: Use this skill when the user asks to review code for security issues, input validation gaps, or authentication/authorization problems — for a specific file, route, or the whole project. Triggers include "sprawdź bezpieczeństwo", "security review", "czy to jest bezpieczne", "audyt bezpieczeństwa", "sprawdź walidację", "czy endpoint jest zabezpieczony", and similar requests about input validation, auth, or data exposure. Accepts an optional file or area as $ARGUMENTS.
---

Przeprowadź przegląd bezpieczeństwa dla: $ARGUMENTS (jeśli nie podano, obejmij całe app/api/ i app/admin/).

Sprawdź systematycznie:
1. Walidacja inputu — czy każde pole z request.json()/body jest sprawdzone pod względem typu, obecności, formatu i przynależności do dozwolonego zbioru wartości (enum)? Zwróć uwagę na mass assignment.
2. Autoryzacja/uwierzytelnianie — czy dostęp do trasy/endpointu wymaga jakiejkolwiek weryfikacji tożsamości? Sprawdź middleware.ts, layout.tsx, i same route handlery — ochrona samej strony bez ochrony API pod spodem nie liczy się jako zabezpieczenie.
3. Obsługa błędów — czy nieoczekiwany input (zły JSON, null, zły typ) zwraca czytelny błąd (400), czy wywala nieobsłużony wyjątek (500)?
4. Ujawnianie danych — czy odpowiedzi błędów nie zdradzają szczegółów implementacji.

Dla każdego problemu: poziom ryzyka (wysokie/średnie/niskie), konkretna linia/plik, praktyczna rekomendacja dopasowana do skali projektu.

Nie instaluj nowych zależności bez zgody (zgodnie z CLAUDE.md).
