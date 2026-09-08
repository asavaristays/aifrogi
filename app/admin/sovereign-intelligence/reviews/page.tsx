import {PilotReviewWorkspace} from '@/components/analytics/pilot-review-workspace';
import {getCurrentUser} from '@/lib/auth-server';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default async function Page(){
 const user=await getCurrentUser();if(user?.role!=='admin')redirect('/login');
 return <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8"><a className="text-sm underline" href="/admin/sovereign-intelligence">← Intelligence Operations</a><h1 className="text-3xl font-semibold">Review bot answers</h1><p className="max-w-3xl text-base text-stone-600">Check the actual answer against approved knowledge. Classify its origin separately from correctness. Saving a review does not change what the bot knows or approve it for launch.</p><PilotReviewWorkspace/></main>;
}
