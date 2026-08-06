import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-[var(--muted)]">
          Loading…
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
