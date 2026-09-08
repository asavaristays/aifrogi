export type DemoOption={id:string;label:string;detail?:string;disabled?:boolean};
export type DemoStep={title:string;options:DemoOption[]};
export type GuidedPersona={name:string;steps:DemoStep[];outcome:string};
export const guidedPersonas:Record<string,GuidedPersona>={
 'showcase-edugpt':{name:'eduGPT',outcome:'Demo counselling request prepared—not an admission or confirmed enrolment.',steps:[
 {title:'Which programme interests you?',options:[{id:'data',label:'Data Foundations',detail:'Beginner · 12 weeks'},{id:'marketing',label:'Digital Marketing',detail:'Beginner · 8 weeks'},{id:'english',label:'English Communication',detail:'All levels · 6 weeks'}]},
 {title:'Your learning stage?',options:[{id:'school',label:'School student',detail:'Guardian involvement required for real onboarding'},{id:'college',label:'College student'},{id:'professional',label:'Working professional'}]},
 {title:'Choose a counselling session',options:[{id:'morning',label:'Morning · 10:00 IST'},{id:'afternoon',label:'Afternoon · 15:00 IST'},{id:'full',label:'Evening · Fully booked',disabled:true}]}]},
 'showcase-propertygpt':{name:'PropertyGPT',outcome:'Demo site-visit request prepared. No agent contacted; no title, price or availability guarantee.',steps:[
 {title:'Where are you looking?',options:[{id:'porvorim',label:'Porvorim'},{id:'assagao',label:'Assagao'}]},
 {title:'Your property preference?',options:[{id:'apartment',label:'Two-bedroom apartment',detail:'Illustrative budget: ₹82 lakh'},{id:'villa',label:'Villa',detail:'Illustrative budget: ₹2.4 crore'}]},
 {title:'Choose a visit time',options:[{id:'morning',label:'10:00 IST'},{id:'afternoon',label:'15:00 IST'}]}]},
 'showcase-flowcart':{name:'FlowCart',outcome:'Demo order prepared. No payment, stock deduction or delivery created.',steps:[
 {title:'Choose a product',options:[{id:'cake',label:'Celebration cake',detail:'₹900 · 2 in fictional stock'},{id:'cookies',label:'Cookie box',detail:'₹350 · 5 in fictional stock'},{id:'coffee',label:'Coffee gift set',detail:'Out of stock',disabled:true}]},
 {title:'Choose quantity',options:[1,2,3,4,5].map(n=>({id:String(n),label:String(n)}))},
 {title:'How would you receive it?',options:[{id:'pickup',label:'Collection',detail:'No delivery fee'},{id:'delivery',label:'Local delivery',detail:'Fictional delivery fee ₹99'}]}]},
 'showcase-businessgpt':{name:'BusinessGPT',outcome:'Demo discovery request prepared. No CRM record, email or commercial commitment created.',steps:[
 {title:'What would you like to improve?',options:[{id:'website',label:'Website and online presence'},{id:'automation',label:'Reduce repetitive work'},{id:'ai',label:'Explore AI for my business'}]},
 {title:'What stage are you at?',options:[{id:'explore',label:'Exploring options'},{id:'scope',label:'Ready to define scope'},{id:'start',label:'Ready to discuss implementation'}]},
 {title:'Choose your next step',options:[{id:'morning',label:'Discovery call · 10:00 IST'},{id:'afternoon',label:'Discovery call · 15:00 IST'}]}]},
 'showcase-custombot':{name:'Custom Bot',outcome:'Demo request awaits supervisor approval. No work order, spending approval or external notification issued.',steps:[
 {title:'What needs attention?',options:[{id:'plumbing',label:'Water leak'},{id:'equipment',label:'Broken office equipment'},{id:'general',label:'General maintenance'}]},
 {title:'Where is the issue?',options:[{id:'reception',label:'Reception'},{id:'meeting',label:'Meeting room'},{id:'floor',label:'First floor office'}]},
 {title:'Choose urgency',options:[{id:'routine',label:'Routine',detail:'Demonstrate standard review queue'},{id:'urgent',label:'Urgent',detail:'Demonstrate priority supervisor review—not emergency response'}]}]}
};
export function personaOptions(slug:string,step:number,selected:string[]):DemoOption[]{
 const options=guidedPersonas[slug]?.steps[step]?.options||[];
 if(slug==='showcase-flowcart'&&step===1)return options.map(o=>({...o,disabled:Number(o.id)>(selected[0]==='cake'?2:5)}));
 if(slug==='showcase-propertygpt'&&step===1)return options.filter(o=>o.id===(selected[0]==='porvorim'?'apartment':'villa'));
 return options;
}
export function validPersonaChoices(slug:string,selected:string[]){return selected.length===3&&selected.every((id,i)=>personaOptions(slug,i,selected).some(o=>o.id===id&&!o.disabled));}
export function personaSummary(slug:string,selected:string[]){
 if(slug==='showcase-flowcart'){const unit=selected[0]==='cake'?900:350;return `Demo total ₹${unit*Number(selected[1])+(selected[2]==='delivery'?99:0)}. Nothing to pay.`;}
 if(slug==='showcase-businessgpt')return `Suggested service: ${{website:'website transformation',automation:'workflow automation',ai:'AI readiness consulting'}[selected[0]]||''}. Final scope requires a human review.`;
 if(slug==='showcase-edugpt'&&selected[1]==='school')return 'A guardian would be involved before any real enrolment. No student records are accessed.';
 return 'Fictional selections only. No external system is changed.';
}
