import {currentQuestion,requestedPublicFactFields} from './public-business-facts';
export type QuestionPlan={parts:Array<{id:string;questionPart:string;query:string;kind:'STATIC'|'LIVE'|'ACTION'}>};
export function singleQuestionPlan(question:string):QuestionPlan{return {parts:[{id:'part-1',questionPart:currentQuestion(question),query:question,kind:'STATIC'}]};}
export function validateQuestionPlan(plan:QuestionPlan){
 if(!plan||!Array.isArray(plan.parts)||!plan.parts.length||plan.parts.length>6)throw Error('QUESTION_PLAN_INVALID');
 const ids=new Set<string>();
 for(const part of plan.parts){if(!part||typeof part.id!=='string'||ids.has(part.id)||!/^part-[1-6]$/.test(part.id)||!['STATIC','LIVE','ACTION'].includes(part.kind)||typeof part.questionPart!=='string'||!part.questionPart.trim()||part.questionPart.length>1000||typeof part.query!=='string'||!part.query.trim()||part.query.length>8000)throw Error('QUESTION_PLAN_INVALID');ids.add(part.id);}
 return plan;
}
export function exactCoordinateRequest(question:string){return requestedPublicFactFields(question).length>0&&!/\b(?:price|cost|services?|training|policy|refund|develop|build|and (?:do|can|what|how)|also)\b/i.test(currentQuestion(question));}
