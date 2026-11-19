// Every page but home sits on the black paper ground (the home page draws its own).
export default function GroundLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="content" className="on-ground bg-ground font-archivo text-ink">
      {children}
    </main>
  );
}
