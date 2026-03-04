const res = await fetch("https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/refs/heads/dev/README.md");
const text = await res.text();

// Find the first table section
const tableStart = text.indexOf('<table>');
const firstRows = text.substring(tableStart, tableStart + 3000);
console.log("=== First 3000 chars of table ===");
console.log(firstRows);
