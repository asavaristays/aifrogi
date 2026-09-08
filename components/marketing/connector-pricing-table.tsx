'use client';
import { useEffect, useRef, useState } from 'react';
import guides from '@/data/connector-guides.json';
import styles from './connector-pricing-table.module.css';

export function ConnectorPricingTable() {
  const viewport = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [overflowing, setOverflowing] = useState(false);
  useEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const update = () => {
      const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
      setOverflowing(maximum > 1);
      setPosition(maximum > 0 ? Math.max(0, Math.min(100, element.scrollLeft / maximum * 100)) : 0);
    };
    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    observer?.observe(element);
    if (element.firstElementChild) observer?.observe(element.firstElementChild);
    return () => {element.removeEventListener('scroll', update); window.removeEventListener('resize', update); observer?.disconnect();};
  }, []);
  function slideTo(percent: number) {
    const element = viewport.current;
    if (!element) return;
    const next = Math.max(0, Math.min(100, percent));
    element.scrollLeft = (element.scrollWidth - element.clientWidth) * next / 100;
    setPosition(next);
  }
  return <section id="connector-guides" className="mt-8 min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/20 bg-white/[.04]">
    <div className="px-6 py-5"><h3 className="text-xl font-semibold">Choose your connector. Download its checklist.</h3><p className="mt-2 text-sm leading-6 text-white/75">Optional for the AI Bot family; WhatsApp is not required. Examples below describe possible workflows, not automatic features. Setup is quoted and approved before work begins.</p></div>
    {overflowing && <div className={styles.controls}>
      <p id="connector-scroll-help">Swipe the table or slide below to see prices and PDFs.</p>
      <div className={styles.actions}><button type="button" onClick={()=>slideTo(0)} disabled={position < 1}>← Connectors</button><button type="button" onClick={()=>slideTo(100)} disabled={position > 99}>Show PDF downloads →</button></div>
      <input type="range" min="0" max="100" step="1" value={Math.round(position)} onChange={event=>slideTo(Number(event.target.value))} aria-label="Slide connector table horizontally" aria-controls="connector-table-scroll" aria-valuetext={`${Math.round(position)}% across the table`} />
    </div>}
    <div ref={viewport} id="connector-table-scroll" className={styles.viewport} tabIndex={0} role="region" aria-label="Connector pricing and PDF downloads" aria-describedby={overflowing ? 'connector-scroll-help' : undefined}><table className="w-full min-w-[760px] text-left text-sm"><caption className="sr-only">Connector requirements, suitable bots and indicative setup charges</caption><thead className="text-[#e2c66d]"><tr>{['Connector','Suitable bots / workflow','One-time setup','Your checklist'].map(label=><th scope="col" key={label} className="px-6 py-4">{label}</th>)}</tr></thead><tbody>{guides.map(guide=><tr key={guide.id} className="border-t border-white/15"><th scope="row" className="px-6 py-4 font-semibold text-white">{guide.name}</th><td className="px-6 py-4 leading-6 text-white/75">{guide.bots}</td><td className="px-6 py-4 leading-6 text-white/75">{guide.fee.replaceAll('INR ', '₹')}</td><td className="px-6 py-4"><a href={`/downloads/AiFrogi-${guide.id}-Checklist.pdf`} download aria-label={`Download ${guide.name} checklist PDF`} className="inline-flex min-h-11 items-center whitespace-nowrap rounded-full border border-[#e2c66d]/60 px-4 py-2 text-[#e2c66d] underline underline-offset-4">↓ PDF checklist</a></td></tr>)}</tbody></table></div>
    <p className="border-t border-white/15 px-6 py-4 text-sm leading-6 text-white/75">Provider fees, taxes, subscription and extra custom work are separate unless quoted together. Standard Razorpay onboarding and WhatsApp Flow are included only in the ₹4,500 WhatsApp setup; the custom Razorpay range above is for additional workflow requirements. Combined integrations require a combined quotation.</p>
  </section>;
}
