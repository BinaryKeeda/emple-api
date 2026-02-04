import fs from "fs";

function jsonToCSV(data) {
  console.log(data[0])
  const rows = [];
  let maxSections = 0;

  // First pass: find max number of sections
  data.forEach(doc => {
    const sectionCount = doc.responseResults.length - 1;
    if (sectionCount > maxSections) {
      maxSections = sectionCount;
    }
  });

  // Build CSV headers
  const headers = [
    "name",
    "sap_id",
    "overallCorrect",
    "overallTotal",
  ];

  for (let i = 1; i <= maxSections; i++) {
    headers.push(`section${i}Correct`, `section${i}Total`);
  }

  rows.push(headers.join(","));

  // Build rows
  data.forEach(doc => {
    let overall = doc.responseResults[0];
    let row = [
      `"${doc.name}"`,
      doc.sap_id,
      overall?.correct ?? overall?.passCount ?? 0,
      overall?.total ?? overall?.totalCount ?? 0,
    ];
    overall = doc.responseResults[1];
    row = [
      ...row,
      [overall?.correct ?? overall?.passCount ?? 0,
      overall?.total ?? overall?.totalCount ?? 0,
      ]
    ];
    overall = doc.responseResults[2];
    row = [
      ...row,
      [overall?.correct ?? overall?.passCount ?? 0,
      overall?.total ?? overall?.totalCount ?? 0,
      ]
    ];
    overall = doc.responseResults[3];
    row = [
      ...row,
      [overall?.correct ?? overall?.passCount ?? 0,
      overall?.total ?? overall?.totalCount ?? 0,
      ]
    ]
    for (let i = 4; i <= maxSections; i++) {
      const section = doc.responseResults[i];
      let sectionCorrect = 0;
      let sectionTotal = 0;

      if (Array.isArray(section)) {
        section.forEach(item => {
          sectionCorrect += item.passCount ?? 0;
          sectionTotal += item.totalCount ?? 0;
        });
      }

      row.push(sectionCorrect, sectionTotal);
    }

    rows.push(row.join(","));
  });

  return rows.join("\n");
}

// --------------------
// USAGE
// --------------------
const input = JSON.parse(fs.readFileSync("result.json", "utf-8"));
const csv = jsonToCSV(input);

fs.writeFileSync("result.csv", csv);
console.log("✅ CSV generated: result.csv");
