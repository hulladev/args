module.exports = {
  hooks: {
    beforePacking(pkg) {
      // Workspace development tools are not part of the consumer contract.
      // pnpm can resolve these entries in different orders across pack runs.
      delete pkg.devDependencies
      return pkg
    },
  },
}
