"use client";

import { PlayCircle } from "lucide-react";
import { useState } from "react";

import { signInAsDemo } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { useAction } from "@/lib/use-action";

export function DemoSignInButton({ autoStart = false }: { autoStart?: boolean }) {
  const { busy: pending, run: execute } = useAction();
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    execute(async () => {
      const result = await signInAsDemo();
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={run}
        disabled={pending}
        autoFocus={autoStart}
      >
        <PlayCircle className="size-4" />
        {pending ? "Loading the demo…" : "Continue with the demo account"}
      </Button>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
