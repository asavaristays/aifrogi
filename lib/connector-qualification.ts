import { executeGovernedTransaction, type TransactionOutcome } from "@/lib/transaction-capability-gateway";

export const ADMITTED_TRANSACTION_CONNECTORS = ["FLOWCART_INTERNAL","AIFROGI_DEMO_MOCK"] as const;
export type AdmittedTransactionConnector = typeof ADMITTED_TRANSACTION_CONNECTORS[number];

export async function qualifyConnectorAmbiguity(connector: AdmittedTransactionConnector) {
  const outcomes = new Map<string,TransactionOutcome>();
  let sends=0;
  const store=(failFinalize=false)=>({
    reserve:async(key:string)=>({existing:outcomes.get(`${connector}:${key}`)??null}),
    finalize:async(key:string,outcome:TransactionOutcome)=>{if(failFinalize)throw new Error("SYNTHETIC_COMMIT_FAILURE");outcomes.set(`${connector}:${key}`,outcome);},
    markUncertain:async(key:string,outcome:TransactionOutcome)=>{outcomes.set(`${connector}:${key}`,outcome);},
  });
  const acceptedCommitUnknown=await executeGovernedTransaction({operationKey:"accepted",timeoutMs:25,store:store(true),send:async()=>{sends++;return{accepted:true,providerReference:`${connector}-accepted`};}});
  const duplicate=await executeGovernedTransaction({operationKey:"accepted",timeoutMs:25,store:store(),send:async()=>{sends++;return{accepted:true,providerReference:"must-not-send"};}});
  const timeout=await executeGovernedTransaction({operationKey:"timeout",timeoutMs:2,store:store(),send:async()=>new Promise(()=>{})});
  const rejected=await executeGovernedTransaction({operationKey:"rejected",timeoutMs:25,store:store(),send:async()=>{throw new Error("PROVIDER_REJECTED");}});
  return {connector,acceptedCommitUnknown,duplicate,timeout,rejected,sendCount:sends,pass:acceptedCommitUnknown.state==="UNCERTAIN"&&duplicate.state==="UNCERTAIN"&&timeout.state==="UNCERTAIN"&&rejected.state==="FAILED"&&sends===1};
}
