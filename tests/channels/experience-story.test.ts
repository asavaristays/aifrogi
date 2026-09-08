import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chapterAt,chapterStarts,storyChapters,storyDuration,experienceBots} from '../../lib/experience-story';
test('guided story is exactly 45 seconds with eight reachable chapters',()=>{
  assert.equal(storyDuration,45);assert.equal(storyChapters.length,8);
  for(let i=0;i<8;i++){assert.equal(chapterAt(chapterStarts[i]),i);assert.equal(chapterAt(chapterStarts[i]+storyChapters[i].seconds-.01),i);}
  assert.equal(chapterAt(45),7);assert.equal(chapterAt(-1),0);
});
test('all eight distinct family demo links remain within the showcase scope',()=>{
  assert.equal(experienceBots.length,8);assert.equal(new Set(experienceBots.map(bot=>bot.slug)).size,8);
  for(const bot of experienceBots)assert.match(bot.slug,/^showcase-[a-z]+$/);
});
test('experience is opt-in playback with accessible pause and non-transactional demo',()=>{
  const source=readFileSync('components/marketing/experience-story.tsx','utf8');
  assert.match(source,/\[playing,setPlaying\]=useState\(false\)/);
  assert.match(source,/\[music,setMusic\]=useState\(false\)/);
  assert.doesNotMatch(source,/speechSynthesis|SpeechSynthesisUtterance|narration/);
  assert.match(source,/document.hidden\)setPlaying\(false\)/);
  assert.match(source,/clearInterval\(interval\)/);
  assert.match(source,/no real booking/);
  assert.match(source,/setSlot\(value\);setConfirmed\(false\);setTime\(chapterStarts\[1\]\)/);
  assert.match(source,/setTime\(0\);setConfirmed\(false\);setPlaying\(true\)/);
  assert.match(source,/not a claim of regulatory certification/);
  assert.match(source,/aria-label="Next chapter"/);
  assert.doesNotMatch(source,/\bfetch\(|\/api\//);
  const css=readFileSync('components/marketing/experience-story.module.css','utf8');
  assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/overflow:auto/);
});
