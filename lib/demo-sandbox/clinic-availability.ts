// Fictional, deterministic demo schedule. Never used by real booking connectors.
export const clinicServices = [
 {id:'consult',name:'Dental consultation',duration:30,fee:500},
 {id:'clean',name:'Teeth cleaning',duration:60,fee:1200},
 {id:'whiten',name:'Whitening consultation',duration:30,fee:500}
] as const;
export const clinicDoctors = [
 {id:'meera',name:'Dr Meera Shah',specialty:'General dentistry',services:['consult','clean']},
 {id:'arjun',name:'Dr Arjun Rao',specialty:'Cosmetic dentistry',services:['consult','whiten']}
];
export function clinicDates(now=new Date()) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const dates:string[]=[];
 for(let n=1;n<=10;n++){const d=new Date(today+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);if(d.getUTCDay()!==0)dates.push(d.toISOString().slice(0,10));}
 return dates.slice(0,6);
}
export function clinicSlots(serviceId:string,doctorId:string,date:string,now=new Date()){
 const service=clinicServices.find(s=>s.id===serviceId),doctor=clinicDoctors.find(d=>d.id===doctorId);
 if(!service||!doctor?.services.includes(serviceId)||!clinicDates(now).includes(date))return [];
 // Fixed fictional occupied intervals: Meera 11–12, Arjun 14–15.
 const busy=doctorId==='meera'?[660,720]:[840,900];
 return Array.from({length:16},(_,i)=>600+i*30).filter(start=>start+service.duration<=1080&&(start+service.duration<=busy[0]||start>=busy[1])).map(m=>`${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`);
}
export function clinicSelectionValid(service:string,doctor:string,date:string,time:string,now=new Date()){
 return clinicSlots(service,doctor,date,now).includes(time);
}
