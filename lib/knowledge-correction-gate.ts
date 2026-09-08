export function assertCorrectionPublishable(input: {
 status:string; validationStatus:string; conflictStatus:string;
 fieldApprovedBy:string|null; fieldApprovedAt:Date|null;
 question:string; answer:string; previewQuestion:string; previewAnswer:string;
 openFlags:number; expiresAt:Date|null; effectiveAt:Date|null; now?:Date;
}) {
 const now=input.now||new Date();
 if(input.status!=='PREVIEW_PENDING')throw Error('Claim is no longer awaiting preview approval. Review its current state.');
 if(input.validationStatus!=='VALID'||input.conflictStatus!=='CLEAR')throw Error('Resolve validation errors and conflicts before publication.');
 if(!input.fieldApprovedBy||!input.fieldApprovedAt)throw Error('Named field approval is required.');
 if(input.question!==input.previewQuestion||input.answer!==input.previewAnswer)throw Error('Preview is stale. Generate and review a new preview.');
 if(input.openFlags)throw Error('This claim has an open incorrect-fact flag and cannot be published.');
 if(input.expiresAt&&input.expiresAt<=now)throw Error('Claim validity expired before publication.');
 if(input.effectiveAt&&input.effectiveAt>now)throw Error('Claim is not effective yet.');
}
