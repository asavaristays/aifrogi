import {NextResponse} from "next/server";
import {getCurrentClientAccess,canManageWorkspace} from "@/lib/client-access";
import {verifyRazorpayCheckoutSignature} from "@/lib/razorpay-billing";
import {recordReadinessCapturedPayment,deliverReadinessBillingEvent} from "@/lib/readiness-billing";
export async function POST(request:Request){
 const access=await getCurrentClientAccess();if(!access)return NextResponse.json({error:"Sign in to your billing workspace."},{status:401});
 if(!canManageWorkspace(access.role))return NextResponse.json({error:"Owner or admin required."},{status:403});
 const input=await request.json().catch(()=>null) as {razorpay_order_id?:string;razorpay_payment_id?:string;razorpay_signature?:string}|null;
 if(!input?.razorpay_order_id || !input.razorpay_payment_id || !input.razorpay_signature)return NextResponse.json({error:"Incomplete confirmation."},{status:400});
 try{
  if(!verifyRazorpayCheckoutSignature({orderId:input.razorpay_order_id,paymentId:input.razorpay_payment_id,signature:input.razorpay_signature}))return NextResponse.json({error:"Invalid payment signature."},{status:400});
  const result=await recordReadinessCapturedPayment(input.razorpay_order_id,input.razorpay_payment_id,access.organization.id);
  try{await deliverReadinessBillingEvent(result.eventId);return NextResponse.json({ok:true,invoiceId:result.invoiceId,delivery:"CONFIRMED"});}
  catch{return NextResponse.json({ok:true,invoiceId:result.invoiceId,delivery:"PENDING_RETRY"},{status:202});}
 }catch{return NextResponse.json({error:"Payment requires billing reconciliation. Do not pay again."},{status:409});}
}
