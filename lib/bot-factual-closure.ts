import { Prisma } from "@/generated/prisma/client";
import { getDb } from "@/lib/db";

export async function assertBotFactualServingOpen(propertyId:string) {
  const db=getDb();
  if(!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows=await db.$queryRaw<Array<{open:boolean}>>(Prisma.sql`SELECT aifrogi_security.is_bot_factual_open(${propertyId}) AS open`);
  if(rows[0]?.open!==true) throw new Error("BOT_FACTUAL_SERVING_CLOSED");
}

export async function setBotFactualClosure(input:{propertyId:string;closed:boolean;expectedVersion:number;incidentId:string;reason:string;actor:string}) {
  const db=getDb();
  if(!db) throw new Error("DATABASE_UNAVAILABLE");
  const rows=await db.$queryRaw<Array<{version:bigint}>>(Prisma.sql`SELECT aifrogi_security.set_bot_factual_closure(${input.propertyId},${input.closed},${BigInt(input.expectedVersion)},${input.incidentId},${input.reason},${input.actor}) AS version`);
  return {version:Number(rows[0]?.version)};
}
