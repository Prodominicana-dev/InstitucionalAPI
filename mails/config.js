

/** @type {import('@maizzle/framework').Config} */
module.exports = {
  safeClassNames: false,
  build: {
    templates: {
      source: 'src/templates',
      destination: {
        path: 'build_local',
      },
      assets: {
        source: 'src/images',
        destination: 'images',
      },
    },
  },
}
