import fs from 'fs';
import path from 'path';

// Read request.json
const requestPath = path.join(process.cwd(), 'request.json');
const request = JSON.parse(fs.readFileSync(requestPath, 'utf-8'));

console.log('Generating files for task:', request.task);

// 1️⃣ Generate index.html
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${request.brief}</title>
</head>
<body>
  <h1>${request.brief}</h1>
  <p>Round: ${request.round}</p>
</body>
</html>
`;
fs.writeFileSync('index.html', htmlContent);
console.log('✅ index.html created');

// 2️⃣ Generate README.md
const readmeContent = `# ${request.task}

Brief: ${request.brief}  
Round: ${request.round}  
Student Email: ${request.email}
`;
fs.writeFileSync('README.md', readmeContent);
console.log('✅ README.md created');

// 3️⃣ Generate LICENSE (MIT)
const licenseContent = `MIT License

Copyright (c) ${(new Date()).getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files...
`;
fs.writeFileSync('LICENSE', licenseContent);
console.log('✅ LICENSE created');
