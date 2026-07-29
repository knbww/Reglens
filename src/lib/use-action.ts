"use client";

import { useCallback, useState } from "react";

/**
 * Runs a server action from an event handler with a local busy flag.
 *
 * Deliberately not `useTransition`: a transition's pending state also covers
 * the router refresh that `revalidatePath` kicks off, which can leave controls
 * disabled long after the write itself has completed. Here `busy` tracks only
 * the action, so buttons re-enable as soon as the work is done while the
 * refreshed data streams in behind it.
 */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (cause) {
      // A server action that calls redirect() rejects with a framework signal;
      // the navigation is already happening, so there is nothing to report.
      const digest = (cause as { digest?: string })?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw cause;
      setError((cause as Error)?.message ?? "Something went wrong. Please try again.");
      return undefined;
    } finally {
      setBusy(false);
    }
  }, []);

  return { busy, error, setError, run };
}
