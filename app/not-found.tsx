import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main id="content" className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-10">
      <section className="max-w-prose">
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 text-gray-700">
          There&apos;s no page at this address. It may have moved when the lab&apos;s website was rebuilt.
        </p>
        <p className="mt-6">
          <Link href="/">Go to the home page</Link>
        </p>
      </section>
    </main>
  );
}
