const fs = require("fs");
const path = require("path");

const ARTIFACTS_DIR = path.join(__dirname, "../artifacts");
const KNIP_REPORT = path.join(ARTIFACTS_DIR, "knip-report.json");
const DEP_GRAPH = path.join(ARTIFACTS_DIR, "depgraph.json");
const OUTPUT_FILE = path.join(ARTIFACTS_DIR, "llm-context-pack.md");
const PACKAGE_JSON = path.join(__dirname, "../package.json");

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function generate() {
  const pkg = readJson(PACKAGE_JSON);
  const knip = readJson(KNIP_REPORT);
  const graph = readJson(DEP_GRAPH);

  let md = `# Project Context Pack (Generated: ${new Date().toISOString()})\n\n`;

  // 1. Project Snapshot
  md += `## 1. Project Snapshot\n`;
  md += `- **Name**: ${pkg.name}\n`;
  md += `- **Version**: ${pkg.version}\n`;
  md += `- **Main Entry**: ${pkg.main}\n`;
  md += `- **Dependencies**: ${Object.keys(pkg.dependencies || {}).length}\n`;
  md += `- **DevDependencies**: ${Object.keys(pkg.devDependencies || {}).length}\n\n`;

  // 2. Unused Code (Knip)
  md += `## 2. Code Health (Knip)\n`;
  if (knip) {
    const unusedFiles = knip.files || [];
    const unusedExports = knip.exports || [];
    const unusedDeps = knip.dependencies || [];

    md += `- **Unused Files**: ${unusedFiles.length}\n`;
    if (unusedFiles.length > 0) {
      md += `<details><summary>View List</summary>\n\n${unusedFiles.map((f) => `- ${f}`).join("\n")}\n</details>\n`;
    }

    md += `- **Unused Exports**: ${unusedExports.length}\n`;
    md += `- **Unused Dependencies**: ${unusedDeps.length}\n`;
    if (unusedDeps.length > 0) {
      md += `  - ${unusedDeps.join(", ")}\n`;
    }
  } else {
    md += `*Knip report not found or empty.*\n`;
  }
  md += `\n`;

  // 3. Architecture (Dependency Cruiser)
  md += `## 3. Architecture\n`;
  if (graph) {
    const modules = graph.modules || [];
    const circulars = modules.filter((m) => m.circular);

    md += `- **Total Modules Scanned**: ${modules.length}\n`;
    md += `- **Circular Dependencies**: ${circulars.length}\n`;

    if (circulars.length > 0) {
      md += `### Circular Dependency Chains\n`;
      circulars.forEach((c) => {
        md += `- ${c.source}\n`;
      });
    }

    // Top-level folders
    const topLevel = new Set(modules.map((m) => m.source.split("/")[0]));
    md += `### Top Level Directories\n`;
    topLevel.forEach((d) => (md += `- ${d}/\n`));
  } else {
    md += `*Dependency graph not found.*\n`;
  }

  fs.writeFileSync(OUTPUT_FILE, md);
  console.log(`Context pack generated at ${OUTPUT_FILE}`);
}

generate();
