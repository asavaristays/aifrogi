import {normalizeRagQuestion} from './rag-query-normalization';
import type { AnswerDraft, AnswerEvidence } from './shared-answer-engine';

export type PublicFactField = 'phone' | 'email' | 'address' | 'hours';
export type PublicBusinessFact = { field: PublicFactField; value: string; evidenceIds: string[] };

/** Only requested public business coordinates enter this path; private requests
 * remain subject to the intent boundary before the answering engine. */
export function currentQuestion(question:string) { return question.split(/(?:CURRENT visitor question:|Follow-up question:)\s*/i).at(-1) || question; }

export function requestedPublicFactFields(question: string): PublicFactField[] {
  question=normalizeRagQuestion(currentQuestion(question));
  const fields: PublicFactField[] = [];
  if (/\b(?:phone|telephone|mobile|whatsapp|contact num(?:ber|br)|call you|call them)\b|फोन|मोबाइल/iu.test(question)) fields.push('phone');
  if (/\b(?:email|e-mail)\b/iu.test(question)) fields.push('email');
  if (/\b(?:address|location|located|office|where are you|where is your|where are they)\b|पता/iu.test(question) && !/\b(?:email|e-mail) address\b/i.test(question)) fields.push('address');
  if (/\b(?:opening hours|business hours|office hours|timings)\b/i.test(question)) fields.push('hours');
  if (!fields.length && /\b(?:contact details|contact information|how (?:can|do) i (?:contact|reach))\b/i.test(question)) fields.push('phone', 'email');
  return fields;
}

export function publicFactRetrievalQuery(question: string) {
  const fields = requestedPublicFactFields(question);
  const aliases: Record<PublicFactField, string> = { phone: 'telephone whatsapp phone', email: 'email contact', address: 'address PostalAddress operates', hours: 'opening hours timings contact' };
  return fields.length ? fields.map(field => aliases[field]).join(' ') : question;
}


export function publicFactRetrievalQueries(question: string): string[] {
  const fields=requestedPublicFactFields(question);
  if(!fields.length) return [question];
  const queries: Record<PublicFactField,string[]>={phone:['telephone whatsapp phone'],email:['email'],address:['PostalAddress','operates','address'],hours:['opening hours timings']};
  return [...new Set(fields.flatMap(field=>queries[field]))];
}

/** Extract exact values only from explicit contact evidence. A service-area
 * mention is never promoted into an address, and arbitrary numbers are never
 * treated as phone numbers. No cache survives a publication or tenant change. */
export function extractPublicBusinessFacts(evidence: AnswerEvidence[]): PublicBusinessFact[] {
  const facts = new Map<string, PublicBusinessFact>();
  const add = (field: PublicFactField, raw: string, id: string) => {
    const value = raw.trim().replace(/\s+/g, ' ');
    const key = `${field}:${field === 'phone' ? value.replace(/\D/g, '') : value.toLowerCase()}`;
    const existing = facts.get(key);
    if (existing) existing.evidenceIds.push(id);
    else facts.set(key, { field, value, evidenceIds: [id] });
  };
  for (const unit of evidence) {
    if (!/\b(?:contact|address|location|telephone|phone|whatsapp|email|PostalAddress|opening hours|operates from|registered office)\b|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(`${unit.title} ${unit.url} ${unit.content}`)) continue;
    // Prefer explicit labels. This supports international coordinates without
    // interpreting postal codes, prices or account numbers as contact details.
    for (const m of unit.content.matchAll(/\b(?:phone|telephone|mobile|whatsapp(?: us)?|tel)\s*(?:[:：]\s*|\s+)(\+?\d[\d ()-]{5,24}\d)/gi)) {
      const digits = m[1].replace(/\D/g, '');
      if (digits.length >= 7 && digits.length <= 15) add('phone', m[1], unit.id);
    }
    if (/contact/i.test(`${unit.title} ${unit.url}`)) {
      for (const m of unit.content.matchAll(/(?<!\d)(?:\+?91[\s-]*)?[6-9](?:[\s-]*\d){9}(?!\d)/g)) add('phone', m[0], unit.id);
    }
    for (const m of unit.content.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)) add('email', m[0], unit.id);
    for (const m of unit.content.matchAll(/\b(?:postal address|office address|address|location)\s*[:：]\s*([^\n!?]{8,240}?\b\d{5,6}(?:\s*,?\s*India)?)/gi)) add('address', m[1], unit.id);
    for (const m of unit.content.matchAll(/\b(?:operates from|registered office(?: is)? at|office address is)\s+([^\n!?]{8,240}?\b\d{5,6}(?:\s*,?\s*India)?)/gi)) add('address', m[1], unit.id);
    for (const m of unit.content.matchAll(/\bPostalAddress\s+(.{8,240}?\b\d{6})(?=\s+IN\b|$)/gi)) add('address', m[1], unit.id);
    for (const m of unit.content.matchAll(/\b(?:opening hours|business hours|office hours|timings)\s*[:：]\s*([^\n]{3,120})/gi)) add('hours', m[1], unit.id);
  }
  const all=[...facts.values()];
  const rank=(fact:PublicBusinessFact)=>Math.min(...fact.evidenceIds.map(id=>evidence.find(e=>e.id===id)?.authorityRank??100));
  const strongest=new Map<PublicFactField,number>();
  for(const fact of all) strongest.set(fact.field,Math.min(strongest.get(fact.field)??100,rank(fact)));
  return all.filter(f=>rank(f)===strongest.get(f.field)).map(f => ({ ...f, evidenceIds: [...new Set(f.evidenceIds)] }));
}

export function composePublicFactDraft(question: string, evidence: AnswerEvidence[]): AnswerDraft | null {
  const fields = requestedPublicFactFields(question);
  if (!fields.length) return null;
  const facts = extractPublicBusinessFacts(evidence);
  // Incomplete extraction falls through to grounded composition, so one known
  // field cannot conceal another requested detail or a compound service query.
  if (fields.some(field => !facts.some(f => f.field === field))) return null;
  if (/\b(?:price|cost|services?|training|policy|refund|develop|build)\b/i.test(currentQuestion(question))) return null;
  const labels = { phone: 'Phone', email: 'Email', address: 'Address', hours: 'Business hours' };
  return { disposition: 'ANSWER', sentences: fields.flatMap(field => facts.filter(f => f.field === field).map(f => ({ text: `${labels[field]}: ${f.value}`, kind: 'FACT' as const, evidenceIds: f.evidenceIds.slice(0, 4) }))), missingParts: [] };
}
