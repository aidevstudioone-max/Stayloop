export default function Footer() {
  return (
    <footer className="border-t border-border py-14">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 text-center">
        <a href="#top" className="font-display text-[1rem] font-bold text-ink">Stayloop</a>
        <p className="max-w-[48ch] text-[.86rem] leading-relaxed text-ink-soft">Hotel room booking and management, built for small and independent properties.</p>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-[.8rem] text-ink-soft">
          <a href="#features" className="hover:text-terracotta">Features</a>
          <a href="#preview" className="hover:text-terracotta">Live Preview</a>
          <a href="#pricing" className="hover:text-terracotta">Pricing</a>
        </div>
        <p className="mt-4 text-[.76rem] text-ink-soft/80">© 2026 Stayloop. Demo product by ठिkaana — no real bookings are processed, all data lives in your browser.</p>
      </div>
    </footer>
  )
}
