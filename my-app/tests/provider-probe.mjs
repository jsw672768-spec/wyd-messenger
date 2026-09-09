// A small synthetic, non-personal phrase only. This diagnostic never claims UI QA.
import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import { translate } from '../lib/translation-engine.ts';
const samples=[];
for(const target of ['ko','fr']) {
 const start=performance.now();
 try {
  const translated=await translate('Meet at the main gate.','en',target);
  samples.push({target,status:'success',milliseconds:Math.round(performance.now()-start),translated});
 } catch {samples.push({target,status:'unavailable',milliseconds:Math.round(performance.now()-start)});}
}
await writeFile('../translation-provider-probe.json',JSON.stringify({provider:'MyMemory',source:'en',text:'Meet at the main gate.',samples},null,2));
console.log(JSON.stringify(samples));
