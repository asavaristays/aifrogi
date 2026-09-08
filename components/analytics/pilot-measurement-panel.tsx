import {getPilotMeasurement} from '@/lib/repositories/pilot-measurement-repository';
export async function PilotMeasurementPanel({propertyId}:{propertyId?:string}){
 const report=await getPilotMeasurement(propertyId).catch(()=>null);
 return <section className="rounded-3xl border border-black/10 bg-white p-6 text-stone-900">
 <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-xl font-semibold">Pilot evidence · Last 30 days</h2>{!propertyId&&<a href="/admin/sovereign-intelligence/reviews" className="rounded-full bg-black px-5 py-3 text-sm font-semibold" style={{color:'#fff'}}>Review bot answers →</a>}</div>
 <p className="my-3 text-sm text-stone-600">Real-world accuracy is not certified. Known demos stay synthetic. Other answers stay unclassified until an administrator confirms their origin. Helpful votes and automated safety flags are not accuracy scores.</p>
 {!report?<p>Measurement unavailable. No score issued.</p>:<>
 <p className="text-sm">{report.sampledEvidence} of {report.totalEvidence} answer records analysed{report.truncated?' — partial sample, not a complete report':''}.</p>
 {report.reviewsTruncated&&<p role="alert" className="mt-3 text-red-800">Review history exceeds the reporting limit. Review-based metrics are withheld.</p>}
 <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr>{['Bot / cohort','Answers / chats','Ratings + / −','Decision mismatches','Near misses','Human review'].map(h=><th key={h} className="p-3">{h}</th>)}</tr></thead><tbody>{report.groups.map(g=><tr key={[g.propertyId,g.persona,g.cohort].join(':')} className="border-t">
 <td className="p-3">{g.slug}<span className="block text-sm">{g.persona} · {g.cohort}</span></td>
 <td className="p-3">{g.answers} / {g.conversations}</td>
 <td className="p-3">{g.helpfulAnswers} / {g.negativeAnswers}<span className="block">{g.feedbackCoveragePercent.toFixed(1)}% rated</span></td>
 <td className="p-3">{g.decisionMismatches} / {g.classifiedDecisions} checked<span className="block">{g.unclassifiedDecisions} unknown</span></td>
 <td className="p-3">{g.retrievalNearMissAnswers}</td>
 <td className="min-w-52 p-3">{g.reviewedAnswers}/{g.answers} assessed<span className="block">{g.reviewOutcomes.UNRESOLVED} unresolved</span><span className="block">{g.humanReviewedAccuracy===null?'Correctness score withheld':g.humanReviewedAccuracy.toFixed(1)+'% correct in reviewed real-answer sample'}</span>{g.humanReviewedAccuracy!==null&&<span className="block">{g.reviewOutcomes.CORRECT}/{g.resolvedReviews} resolved assessments · not certification</span>}</td>
 </tr>)}</tbody></table></div>
 {!report.groups.length&&<p className="mt-4">No evidence in this window.</p>}
 <p className="mt-4 text-sm text-stone-600">Unresolved assessments are shown separately, not counted as correct. A small or selectively reviewed sample cannot establish population accuracy, weighted Safe Resolution Rate, or launch approval.</p>
 <a className="mt-4 inline-block underline" href="/api/pilot-measurement" target="_blank" rel="noopener noreferrer">Open scoped measurement report (JSON)</a>
 </>}</section>;
}
