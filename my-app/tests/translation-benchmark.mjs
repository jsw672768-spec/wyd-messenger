import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { writeFile } from 'node:fs/promises';
import { translate, translationMetrics } from '../lib/translation-engine.ts';
const original=globalThis.fetch;
const fragments=Array.from({length:8},(_,i)=>String.fromCharCode(97+i).repeat(450));
globalThis.fetch=async url=>{await new Promise(resolve=>setTimeout(resolve,80));return Response.json({responseStatus:200,responseData:{translatedText:new URL(url).searchParams.get('q')}});};
const reserve=async()=>{};
const report={kind:'controlled-latency-fixture',providerLatencyMs:80,chunks:8,notes:'Synthetic upstream responses. Not a live network or translation quality measurement.'};
try {
  let start=performance.now();
  for(const text of fragments) await translate(text,'en','ko',reserve);
  report.sequentialMs=Math.round(performance.now()-start);
  start=performance.now();
  assert.equal(await translate(fragments.join(''),'en','ko',reserve),fragments.join(''));
  report.parallelMs=Math.round(performance.now()-start);
  report.speedup=Number((report.sequentialMs/report.parallelMs).toFixed(2));
  start=performance.now(); await translate(fragments.join(''),'en','ko',reserve);
  report.cacheMs=Number((performance.now()-start).toFixed(2));
  report.metrics=translationMetrics();
  assert.equal(report.metrics.maxConcurrent,4);
  assert.ok(report.parallelMs<report.sequentialMs*.7,'Parallel work should reduce controlled latency');
} finally {globalThis.fetch=original;}
await writeFile('../translation-benchmark.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
