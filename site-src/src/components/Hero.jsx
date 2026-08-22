import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import gsap from 'gsap'
import { IconBed, IconCalendar, IconKey } from './Icons.jsx'

const rise = (delay) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.7, delay, ease: [0.2, 0.7, 0.2, 1] } })

export default function Hero() {
  const cardRef = useRef(null)
  useEffect(() => {
    if (cardRef.current) gsap.to(cardRef.current, { y: -10, duration: 4.5, repeat: -1, yoyo: true, ease: 'sine.inOut' })
  }, [])

  return (
    <section id="top" className="relative overflow-hidden pt-28 pb-20 md:pt-36">
      <div aria-hidden className="pointer-events-none absolute -left-40 -top-24 h-[440px] w-[440px] rounded-full opacity-70 blur-[10px]" style={{ background: 'radial-gradient(circle, rgba(193,98,45,.16), rgba(193,98,45,0) 65%)' }} />
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-14 px-6 lg:grid-cols-2">
        <div>
          <motion.span {...rise(0)} className="mb-5 inline-flex items-center gap-2 rounded-full bg-terracotta-light px-3.5 py-1.5 font-sans text-[.72rem] font-semibold uppercase tracking-[.07em] text-terracotta-dark">
            <IconBed width={14} height={14} /> Hotel &amp; Stay Management, Simplified
          </motion.span>
          <h1 className="mb-5 max-w-xl font-display text-[clamp(2.1rem,5vw,3.4rem)] font-semibold leading-[1.1] tracking-tight text-balance">
            <motion.span {...rise(0.06)} className="block">Every room, every booking,</motion.span>
            <motion.span {...rise(0.14)} className="block italic text-terracotta">always in sync.</motion.span>
          </h1>
          <motion.p {...rise(0.24)} className="mb-8 max-w-[46ch] text-[1.08rem] leading-relaxed text-ink-soft text-pretty">
            Stayloop gives small hotels and guesthouses real-time availability, an instant booking flow, and a dashboard that actually tells you what's happening today — no spreadsheets, no double-bookings.
          </motion.p>
          <motion.div {...rise(0.32)} className="mb-9 flex flex-wrap gap-3">
            <a href="app.html" className="inline-flex items-center gap-2 rounded-lg bg-terracotta px-6 py-3.5 font-semibold text-white shadow-[0_10px_22px_rgba(193,98,45,.28)] transition-transform hover:-translate-y-0.5">
              Try Live Demo <IconKey width={17} height={17} />
            </a>
            <a href="#features" className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-6 py-3.5 font-semibold text-ink transition-colors hover:border-terracotta hover:bg-terracotta-light">
              See Features
            </a>
          </motion.div>
          <motion.div {...rise(0.4)} className="flex flex-wrap gap-x-6 gap-y-2 text-[.88rem] font-medium text-ink-soft">
            <span className="inline-flex items-center gap-2"><IconBed width={16} height={16} /> 6 room types</span>
            <span className="inline-flex items-center gap-2"><IconCalendar width={16} height={16} /> Real-time availability</span>
            <span className="inline-flex items-center gap-2"><IconKey width={16} height={16} /> Zero setup</span>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }}>
          <div ref={cardRef} className="rounded-2xl border border-border bg-surface p-6 shadow-[0_30px_70px_-30px_rgba(156,75,31,.35)]">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-4">
              <div>
                <div className="font-display text-[1.02rem] font-semibold">Deluxe Garden Room</div>
                <div className="text-[.8rem] text-ink-soft">2 nights · 2 guests</div>
              </div>
              <span className="rounded-full bg-green/10 px-3 py-1 font-sans text-[.7rem] font-bold uppercase text-green">Confirmed</span>
            </div>
            {[['Room (×2 nights)', '₹7,000.00'], ['Breakfast add-on', '₹800.00'], ['Taxes', '₹600.00']].map(([label, val]) => (
              <div key={label} className="flex justify-between py-2 text-[.9rem] text-ink-soft"><span>{label}</span><span>{val}</span></div>
            ))}
            <div className="mt-3 flex justify-between border-t border-border pt-3 font-display text-[1.15rem] font-bold"><span>Total</span><span>₹8,400</span></div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
