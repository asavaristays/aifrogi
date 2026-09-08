import {type PilotReview} from './pilot-review';
export type MeasurementRow={id:string;propertyId:string;personaCategory:string;sessionIdHash:string;model:string;grounded:boolean;safeResolution:boolean;observedBehavior:string;decisionConsistent:boolean;disposition:string;nearMissClaimIds:string[];feedback:{helpful:boolean;propertyId:string}|null;property:{slug:string;organization:{isDemo:boolean}|null};review?:Pick<PilotReview,'cohort'|'outcome'>};
function cohort(row: MeasurementRow) {
 return row.property.organization?.isDemo || row.model === 'AIFROGI_DEMO_MOCK_CONNECTOR' ? 'SYNTHETIC' : row.review?.cohort || 'UNCLASSIFIED';
}
export function measurePilot(rows:MeasurementRow[]){
 const groups=new Map<string,MeasurementRow[]>();
 for(const row of rows){const key=[row.propertyId,row.personaCategory,cohort(row)].join(':');const group=groups.get(key)||[];group.push(row);groups.set(key,group);}
 return [...groups.values()].map(group=>{
 const first=group[0];
 const feedback=group.filter(r=>r.feedback&&r.feedback.propertyId===r.propertyId);
 const classified=group.filter(r=>r.observedBehavior!=='UNKNOWN');
 const assessed=group.filter(r=>r.review), resolved=assessed.filter(r=>r.review?.outcome!=='UNRESOLVED');
 const outcomes=Object.fromEntries(['CORRECT','GROUNDED_WRONG','UNGROUNDED','UNSAFE','UNRESOLVED'].map(outcome=>[outcome,assessed.filter(r=>r.review?.outcome===outcome).length]));
 return {propertyId:first.propertyId,slug:first.property.slug,persona:first.personaCategory,cohort:cohort(first),answers:group.length,conversations:new Set(group.map(r=>r.sessionIdHash)).size,ratedAnswers:feedback.length,helpfulAnswers:feedback.filter(r=>r.feedback?.helpful).length,negativeAnswers:feedback.filter(r=>!r.feedback?.helpful).length,feedbackCoveragePercent:100*feedback.length/group.length,feedbackScopeMismatches:group.filter(r=>r.feedback&&r.feedback.propertyId!==r.propertyId).length,automatedSafeAnswers:group.filter(r=>r.safeResolution).length,classifiedDecisions:classified.length,decisionMismatches:classified.filter(r=>!r.decisionConsistent).length,unclassifiedDecisions:group.length-classified.length,retrievalNearMissAnswers:group.filter(r=>r.nearMissClaimIds.length>0).length,ungroundedAnswers:group.filter(r=>r.disposition==='ANSWER'&&!r.grounded).length,
 reviewedAnswers:assessed.length,reviewCoveragePercent:100*assessed.length/group.length,resolvedReviews:resolved.length,reviewOutcomes:outcomes,
 // Reviewed-answer sample statistic only: never population accuracy or certification.
 humanReviewedAccuracy:cohort(first)==='REAL'&&resolved.length?100*outcomes.CORRECT/resolved.length:null,
 realConversationCount:cohort(first)==='REAL'?new Set(group.map(r=>r.sessionIdHash)).size:null,certified:false};
 });
}
