import Link from "next/link";
import { signIn } from "@/app/api/auth/[...nextauth]/route";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <main id="main-content" className="flex min-h-screen animate-[launchlens-fade-in_280ms_ease-out_both] items-center justify-center bg-background px-4 motion-reduce:animate-none">
      <form
        action={async (formData: FormData) => {
          "use server";
          try {
            await signIn("credentials", {
              handle: formData.get("handle") as string,
              recoveryKey: formData.get("recoveryKey") as string,
              redirectTo: "/",
            });
          } catch {
            // redirect is expected, no-op here
          }
        }}
        className="flex w-full max-w-sm flex-col gap-4 rounded-md border border-card bg-card p-6 shadow-[0_24px_80px_-68px_rgba(17,19,18,0.55)]"
      >
        <h1 className="text-lg font-semibold text-foreground">
          Sign in with your recovery key
        </h1>
        <p className="text-sm leading-5 text-muted">
          Enter your handle and recovery key that you created on your first
          visit. If you haven&apos;t linked a recovery key yet, generate one
          from the workspace header.
        </p>

        {params.error ? (
          <p className="rounded-md border border-signal-challenges bg-signal-challenges px-3 py-2 text-sm text-signal-challenges">
            Invalid handle or recovery key. Try again.
          </p>
        ) : null}

        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Handle
          <input
            name="handle"
            type="text"
            autoComplete="username"
            required
            minLength={2}
            className="rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground placeholder-[#8e9c93] transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]"
            placeholder="Your handle"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          Recovery key
          <input
            name="recoveryKey"
            type="password"
            autoComplete="current-password"
            required
            minLength={32}
            className="rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground placeholder-[#8e9c93] transition focus:border-accent focus:outline-none focus:ring-2 focus:ring-[var(--ring-color)]"
            placeholder="Paste your recovery key"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-primary-text transition hover:bg-primary-hover active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
        >
          Sign in
        </button>

        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-card px-5 text-center text-sm font-semibold text-foreground transition hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-color)] focus-visible:ring-offset-2"
        >
          Back to demo
        </Link>

        <p className="text-xs leading-5 text-muted">
          You can still use the app without signing in. The workspace and
          cloud history remain accessible through your browser&apos;s
          capability account.
        </p>
      </form>
    </main>
  );
}
