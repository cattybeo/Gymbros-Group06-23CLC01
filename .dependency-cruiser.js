/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  options: {
    doNotFollow: {
      path: "node_modules",
    },
    includeOnly: "^app|^components|^lib|^hooks|^constants",
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
      archi: {
        collapsePattern:
          "^(node_modules|packages|src|lib|app|bin|test(s?)|spec(s?))/[^/]+|\\d+\\.[^/]+",
      },
    },
  },
};
