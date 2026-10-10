const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('lib/support.ts','utf8');const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};new Function('exports','require','module',compiled)(mod.exports,require,mod);const {previewReply,guestLanguages,handoff,localRedirect}=mod.exports;
const answer={id:'fact',hotel_id:'h',title:'Arrival',body:'Reception is open 24 hours.',category:'checkin',language:'en',approved:true,version:1};
assert.equal(previewReply({category:'checkin',language:'en'},[answer]).body,answer.body);
assert.equal(previewReply({category:'checkin',language:'en'},[{...answer,approved:false}]).handoff,true);
assert.equal(previewReply({category:'checkin',language:'en'},[answer,{...answer,id:'second'}]).handoff,true);
for(const language of guestLanguages){assert.equal(previewReply({category:'checkin',language},[]).body,handoff[language]);assert.equal(previewReply({category:'urgent',language},[{...answer,category:'urgent',language}]).handoff,true);assert.equal(previewReply({category:'billing',language},[{...answer,category:'billing',language}]).handoff,true);}
for(const path of ['https://example.com','/\n/example.com','//example.com','/\\example.com',null])assert.equal(localRedirect(path),'/owner');
assert.equal(localRedirect('/owner'),'/owner');
console.log('PASS: approved information, ambiguity, six-language handoffs, urgent/billing review and safe redirects');
