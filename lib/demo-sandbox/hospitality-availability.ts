// Fixed fictional inventory. No external provider calls or shared reservations.
export function hospitalityDates(now=new Date()) {
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return Array.from({length:7},(_,i)=>addNights(today,i+1));
}
export function addNights(date:string,nights:number){
 const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+nights);return d.toISOString().slice(0,10);
}
export const demoRooms=[{id:'garden',name:'Garden Room',guests:2,rate:4500,description:'Garden-facing · Breakfast included'},{id:'suite',name:'Sea View Suite',guests:4,rate:8500,description:'Sea view · Breakfast included'}];
export function hotelAvailability(date:string,nights:number,guests:number,now=new Date()){
 if(!hospitalityDates(now).includes(date)||![1,2,3].includes(nights)||!Number.isInteger(guests)||guests<1||guests>4)return [];
 return demoRooms.filter(room=>room.guests>=guests&&Array.from({length:nights},(_,i)=>new Date(addNights(date,i)).getUTCDay()).every(day=>day!==(room.id==='garden'?5:6))).map(room=>({...room,total:room.rate*nights}));
}
const tables=[{id:'T2',seats:2,busy:[1200,1290]},{id:'T4',seats:4,busy:[1140,1230]},{id:'T6',seats:6,busy:[1230,1320]}];
export function diningAvailability(date:string,guests:number,now=new Date()){
 if(!hospitalityDates(now).includes(date)||!Number.isInteger(guests)||guests<1||guests>6)return [];
 return [1140,1170,1200,1230,1260,1290].flatMap(start=>{
 const table=tables.find(t=>t.seats>=guests&&(start+90<=t.busy[0]||start>=t.busy[1]));
 return table?[{time:`${Math.floor(start/60)}:${String(start%60).padStart(2,'0')}`,table:table.id,seats:table.seats}]:[];
 });
}
export function hospitalityChoiceValid(mode:'hotel'|'dine',date:string,nights:number,guests:number,choice:string,now=new Date()){
 return mode==='hotel'?hotelAvailability(date,nights,guests,now).some(r=>r.id===choice):diningAvailability(date,guests,now).some(s=>s.time===choice);
}
