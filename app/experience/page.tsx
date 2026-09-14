import { marketingMetadata } from '@/lib/seo';
import { ExperienceStory } from '@/components/marketing/experience-story';
export const metadata = marketingMetadata({title:'Experience AiFrogi',description:'Watch the AiFrogi AI Business Bot film.',path:'/experience'});
export default function ExperiencePage() {
  return <ExperienceStory />;
}
