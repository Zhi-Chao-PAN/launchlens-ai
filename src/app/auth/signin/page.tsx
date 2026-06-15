import { signIn } from "@/app/api/auth/[...nextauth]/route";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8f4] px-4">
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
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-[#d8ded4] bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-[#17201d]">
          Sign in with your recovery key
        </h1>
        <p className="text-sm leading-5 text-[#607069]">
          Enter your handle and recovery key that you created on your first
          visit. If you haven&apos;t linked a recovery key yet, generate one
          from the workspace header.
        </p>

        {params.error ? (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Invalid handle or recovery key. Try again.
          </p>
        ) : null}

        <label className="flex flex-col gap-1 text-sm font-medium text-[#17201d]">
          Handle
          <input
            name="handle"
            type="text"
            autoComplete="username"
            required
            minLength={2}
            className="rounded-md border border-[#d8ded4] px-3 py-2 text-sm text-[#17201d] placeholder-[#8e9c93] focus:border-[#138a72] focus:outline-none"
            placeholder="Your handle"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium text-[#17201d]">
          Recovery key
          <input
            name="recoveryKey"
            type="password"
            autoComplete="current-password"
            required
            minLength={32}
            className="rounded-md border border-[#d8ded4] px-3 py-2 text-sm text-[#17201d] placeholder-[#8e9c93] focus:border-[#138a72] focus:outline-none"
            placeholder="Paste your recovery key"
          />
        </label>

        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#17201d] px-5 text-sm font-semibold text-white transition hover:bg-[#24312d]"
        >
          Sign in
        </button>

        <p className="text-xs leading-5 text-[#8e9c93]">
          You can still use the app without signing in. The workspace and
          cloud history remain accessible through your browser&apos;s
          capability account.
        </p>
      </form>
    </main>
  );
}
