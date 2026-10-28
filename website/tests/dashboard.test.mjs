import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const c=vm.createContext({Intl,Date});
vm.runInContext(readFileSync('public/multi-points.js','utf8')+readFileSync('public/schedule.js','utf8')+readFileSync('public/location-groups.js','utf8'),c);
const p={start:'2026-10-01',end:'2026-10-12'};
assert.equal(c.projectTimeline(p,'2026-10-12').remaining,0);
assert.equal(c.projectTimeline(p,'2026-10-12').complete,true);
assert.equal(c.projectTimeline(p,'2026-10-13').percent,100);
assert.equal(c.projectTimeline(p,'2026-10-11').remaining,1);
assert.equal(c.projectTimeline(p,'2026-09-30').elapsed,0);
assert.equal(c.projectTimeline({start:'2026-02-30',end:'2026-03-03'}).valid,false);
const items=[{kind:'progress',id:'a',label:'Konstruksi',lat:5,lng:96},{kind:'monitoring',id:'b',label:'Supervisi',lat:5,lng:96},{kind:'monitoring',id:'c',label:'Perencanaan',lat:5,lng:96},{kind:'progress',id:'d',label:'Konstruksi',lat:null,lng:null}];
const groups=c.groupProjectLocations(items);assert.equal(groups.length,3);assert.equal(groups[0].items.length,2);assert.equal(groups[2].located,false);assert.equal(items.length,4);
const html=readFileSync('ui/dashboard.html','utf8');
assert.ok(html.indexOf('location-groups.js')<html.indexOf('professional-dashboard.js'));
assert.equal((html.match(/id="auth-title"/g)||[]).length,1);
assert.ok(!/<script[^>]*>\s*[^<\s]/.test(html));
console.log('PASS: date boundaries, invalid dates, grouped locations, missing coordinates, auth markup');
vm.runInContext(readFileSync('public/execution-status.js','utf8'),c);
const dates={start:'2026-10-01',end:'2026-10-12'};
assert.equal(c.executionStatus(dates,'2026-09-30').key,'upcoming');
assert.equal(c.executionStatus(dates,'2026-10-01').key,'ongoing');
assert.equal(c.executionStatus(dates,'2026-10-11').key,'ongoing');
assert.equal(c.executionStatus(dates,'2026-10-12').key,'done');
assert.equal(c.executionStatus(dates,'2026-10-13').key,'done');
assert.equal(c.executionStatus({start:'2026-02-30',end:'2026-03-30'},'2026-03-05').key,'unknown');
assert.equal(c.executionStatus({start:'2026-10-12',end:'2026-10-01'},'2026-10-05').key,'unknown');
assert.equal(c.executionStatus({end:'2026-10-12'},'2026-10-12').key,'unknown');
for(const actual of [0,25,100,null])for(const manualStatus of ['late','done','ongoing','auto']){
 assert.equal(c.executionStatus({...dates,actual,plan:100,manualStatus,updatedAt:'2099-01-01'},'2026-10-05').key,'ongoing');
 assert.equal(c.executionStatus({...dates,actual,manualStatus},'2026-10-12').key,'done');
}
assert.equal(c.jakartaDate(new Date('2026-10-11T17:00:00Z')),'2026-10-12');
console.log('PASS: calendar boundaries, invalid and missing dates, WIB rollover, status independent from progress/manual status/update time');

const multi=c.groupProjectLocations([{id:'multi',kind:'monitoring',label:'Supervisi',points:[{label:'A',lat:1,lng:2},{label:'B',lat:3,lng:4}]},{id:'build',kind:'progress',label:'Konstruksi',lat:1,lng:2}]);assert.equal(multi.length,2);assert.equal(multi[0].items.length,2);assert.equal(multi[1].lng,4);assert.equal(multi[0].label,'Supervisi & Konstruksi');assert.equal(c.groupProjectLocations([{id:'gone',points:[],lat:1,lng:2}])[0].located,false);
console.log('PASS: multiple coordinates, category preservation, grouping and cleared locations');

const pts=c.groupProjectLocations([{id:'photos',kind:'monitoring',label:'Supervisi',points:[{lat:1,lng:2,photo:'/api/photos/a.jpg',progress:50,status:'late'},{lat:3,lng:4,photo:'/api/photos/b.jpg',progress:100,status:'ongoing'}]}]);assert.equal(pts[0].items[0].pointPhoto,'/api/photos/a.jpg');assert.equal(pts[1].items[0].pointPhoto,'/api/photos/b.jpg');assert.equal(pts[0].items[0].manualStatus,'late');assert.equal(pts[1].items[0].manualStatus,'done');
