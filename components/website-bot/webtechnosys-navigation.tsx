'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowUpRight, ChevronRight, GraduationCap, Film, Sparkles, LayoutGrid, Phone, MessageCircle, Link as LinkIcon, Mail } from 'lucide-react';
import type { WidgetMenuConfig, WidgetMenuIcon, WidgetMenuItem } from '@/lib/widget-menu';
import styles from './webtechnosys-navigation.module.css';

const icons: Record<WidgetMenuIcon, ReactNode> = { sparkles: <Sparkles aria-hidden="true" />, training: <GraduationCap aria-hidden="true" />, film: <Film aria-hidden="true" />, grid: <LayoutGrid aria-hidden="true" />, phone: <Phone aria-hidden="true" />, link: <LinkIcon aria-hidden="true" />, mail: <Mail aria-hidden="true" />, chat: <MessageCircle aria-hidden="true" /> };
function destination(item: WidgetMenuItem) { if (item.action === 'CALL') return `tel:${item.value}`; if (item.action === 'EMAIL') return `mailto:${item.value}`; return item.value || '#'; }

export function WebtechnosysNavigation({ onChat, menu }: { onChat: () => void; menu: WidgetMenuConfig }) {
  const [submenu, setSubmenu] = useState<WidgetMenuItem | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  useEffect(() => { if (firstRender.current) { firstRender.current = false; return; } heading.current?.focus(); }, [submenu]);
  const items = submenu?.children || menu.items;
  function option(item: WidgetMenuItem) {
    if (item.action === 'CHAT') return <button key={item.id} type="button" className={styles.option} data-featured={item.featured} onClick={onChat}>{icons[item.icon]}<span>{item.label}</span><MessageCircle aria-hidden="true" /></button>;
    if (item.action === 'SUBMENU') return <button key={item.id} type="button" className={styles.option} data-featured={item.featured} onClick={() => setSubmenu(item)}>{icons[item.icon]}<span>{item.label}</span><ChevronRight aria-hidden="true" /></button>;
    const external = item.action === 'LINK';
    return <a key={item.id} className={styles.option} data-featured={item.featured} href={destination(item)} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined}>{icons[item.icon]}<span>{item.label}</span><ArrowUpRight aria-hidden="true" />{external ? <span className={styles.srOnly}> (opens in a new tab)</span> : null}</a>;
  }
  return <nav className={styles.panel} aria-label="Bot main menu">
    {submenu ? <div className={styles.crumbs}><button type="button" onClick={() => setSubmenu(null)}><ArrowLeft aria-hidden="true" />Back</button><button type="button" onClick={() => setSubmenu(null)}>Main menu</button></div> : null}
    <div key={submenu?.id || 'main'} className={styles.screen}><h2 ref={heading} tabIndex={-1} className={styles.title}>{submenu?.label || menu.heading}</h2><div className={styles.options}>{items.map(option)}</div></div>
    <button type="button" className={styles.chat} onClick={onChat}><MessageCircle aria-hidden="true" />Ask a question</button><p className={styles.note}>Website pages open in a new tab. Your chat stays here.</p>
  </nav>;
}
