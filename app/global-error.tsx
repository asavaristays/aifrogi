"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <html lang="en"><body><main className="flex min-h-screen items-center justify-center bg-[#f6f6f9] px-5 py-12"><section className="w-full max-w-xl rounded-lg border border-[#ded8cb] bg-white p-7"><p className="text-sm font-semibold text-[#6d5310]">AiFrogi needs a moment</p><h1 className="mt-4 text-3xl font-semibold text-[#101010]">The workspace could not be displayed.</h1><p className="mt-3 text-sm leading-6 text-[#68645c]">Messaging services continue independently. Retry this page; if the problem remains, contact info@aifrogi.com.</p><button onClick={reset} className="mt-6 min-h-10 rounded-md bg-[#6d5310] px-4 text-sm font-semibold text-white">Retry</button></section></main></body></html>;
}
