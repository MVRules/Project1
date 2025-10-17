// scripts/generate.js
import fs from 'fs';

const request = JSON.parse(fs.readFileSync('request.json', 'utf-8'));
const round = request.round || 1;

console.log(`Generating files for task: ${request.task}, round: ${round}`);

// Example: create index.html
fs.writeFileSync('index.html', `<h1>${request.brief}</h1>`);

// Example: create README.md
fs.writeFileSync('README.md', `# ${request.task}\n\nRound: ${round}\n\n${request.brief}`);

// Example: create LICENSE
fs.writeFileSync('LICENSE', 'MIT License');

// Done
console.log('Files generated successfully!');
