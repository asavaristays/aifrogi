export const storyChapters = [
  {label:'Meet AiFrogi', seconds:4, title:'Customers ask.\nYour bot acts.', copy:'From the first question to the right next step.'},
  {label:'Watch it happen', seconds:9, title:'Less waiting.\nMore doing.', copy:'Ask. Choose. Confirm. See the difference.'},
  {label:'Built for your business', seconds:6, title:'Your business.\nYour kind of bot.', copy:'Choose a category. Try it yourself.'},
  {label:'Make it yours', seconds:6, title:'Your website.\nYour bot.', copy:'Add knowledge. Review answers. Prepare to launch.'},
  {label:'Connect your tools', seconds:6, title:'Answers are good.\nNext steps are better.', copy:'Your calendar. Your records. Your approved workflow.'},
  {label:'Human when needed', seconds:5, title:'Need a person?\nKeep the context.', copy:'Your customer should not have to start again.'},
  {label:'Start small', seconds:5, title:'Small start.\nReal possibility.', copy:'Test the fit before you commit.'},
  {label:'Your turn', seconds:4, title:'Now, your turn.\nTry AiFrogi.', copy:'Choose your bot. Ask your first question.'}
] as const;
export const chapterStarts = storyChapters.map((_,index)=>storyChapters.slice(0,index).reduce((sum,chapter)=>sum+chapter.seconds,0));
export const storyDuration = storyChapters.reduce((sum,chapter)=>sum+chapter.seconds,0);
export function chapterAt(time:number) {return Math.max(0, chapterStarts.findLastIndex(start=>time>=start));}
export const experienceBots = [
  {name:'ClinicGPT', industry:'Clinics', slug:'showcase-clinicgpt', outcome:'Guide appointment enquiries with checked slots and clear next steps.'},
  {name:'HotelGPT', industry:'Hotels', slug:'showcase-hotelgpt', outcome:'Guide stay enquiries. Live inventory needs an approved PMS connector.'},
  {name:'DineGPT', industry:'Restaurants', slug:'showcase-dinegpt', outcome:'Explore the menu and guide a table-reservation journey.'},
  {name:'eduGPT', industry:'Schools & colleges', slug:'showcase-edugpt', outcome:'Help families and students navigate admissions and counselling.'},
  {name:'PropertyGPT', industry:'Property', slug:'showcase-propertygpt', outcome:'Understand requirements and guide a property or site-visit enquiry.'},
  {name:'FlowCart', industry:'Ecommerce', slug:'showcase-flowcart', outcome:'Help shoppers explore products and progress through an order journey.'},
  {name:'BusinessGPT', industry:'Business services', slug:'showcase-businessgpt', outcome:'Answer service questions and qualify the next customer enquiry.'},
  {name:'Custom Bot', industry:'Your workflow', slug:'showcase-custombot', outcome:'Design a focused workflow with your own approval boundaries.'}
] as const;
