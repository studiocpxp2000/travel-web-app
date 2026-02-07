import fs from 'fs';
const report = JSON.parse(fs.readFileSync('scripts/lighthouse-report.json', 'utf8'));

console.log('Final URL:', report.finalUrl);
const audits = report.audits;
const nonPass = Object.values(audits).filter(a => a.score !== 1 && a.scoreDisplayMode !== 'notApplicable' && a.score !== null).sort((a, b) => (a.score || 0) - (b.score || 0));

console.log('Top failing audits:');
nonPass.slice(0, 10).forEach(a => {
    console.log(`${a.id}: ${a.score} - ${a.title}`);
});

console.log('FCP:', audits['first-contentful-paint'].displayValue);
console.log('LCP:', audits['largest-contentful-paint'].displayValue);
console.log('TBT:', audits['total-blocking-time'].displayValue);
console.log('CLS:', audits['cumulative-layout-shift'].displayValue);
console.log('Speed Index:', audits['speed-index'].displayValue);
