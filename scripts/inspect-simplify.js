const res = await fetch("https://raw.githubusercontent.com/SimplifyJobs/New-Grad-Positions/refs/heads/dev/README.md");
const text = await res.text();

// Check if it uses HTML tables or pipe tables
console.log("=== Has <table> tag:", text.includes('<table>'));
console.log("=== Has <tr> tag:", text.includes('<tr>'));

// Find the first table section
const tableStart = text.indexOf('<table>');
if (tableStart !== -1) {
  const firstRows = text.substring(tableStart, tableStart + 3000);
  console.log("=== First 3000 chars of HTML table ===");
  console.log(firstRows);
} else {
  // Maybe pipe tables - find them
  const lines = text.split('\n');
  let foundTable = false;
  let count = 0;
  for (const line of lines) {
    if (line.startsWith('|') && !foundTable) {
      foundTable = true;
    }
    if (foundTable) {
      console.log(line);
      count++;
      if (count > 30) break;
    }
  }
}

// Also check the speedyapply one
const res2 = await fetch("https://raw.githubusercontent.com/speedyapply/2025-SWE-College-Jobs/refs/heads/main/README.md");
const text2 = await res2.text();
console.log("\n\n=== SPEEDYAPPLY ===");
console.log("Has <table> tag:", text2.includes('<table>'));
const lines2 = text2.split('\n');
let foundTable2 = false;
let count2 = 0;
for (const line of lines2) {
  if (line.startsWith('|') && !foundTable2) {
    foundTable2 = true;
  }
  if (foundTable2) {
    console.log(line);
    count2++;
    if (count2 > 30) break;
  }
}
