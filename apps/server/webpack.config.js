const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { isAbsolute, join } = require('path');

/**
 * pnpm-safe externals: bundle relative/absolute/workspace paths; externalize bare packages.
 * Absolute paths must be bundled on Linux CI/Docker too (not only /Users/...).
 */
function pnpmNodeExternals({ request }, callback) {
  if (!request) {
    return callback();
  }

  if (
    request.startsWith('.') ||
    isAbsolute(request) ||
    request.startsWith('@work-hub/')
  ) {
    return callback();
  }

  return callback(null, `commonjs ${request}`);
}

module.exports = {
  output: {
    path: join(__dirname, 'dist'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externals: [pnpmNodeExternals],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      additionalEntryPoints: [
        {
          entryName: 'generate-openapi',
          entryPath: './src/generate-openapi.ts',
        },
      ],
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMap: true,
      // Custom pnpm-safe externals above; merge so Nx does not wipe them.
      externalDependencies: 'none',
      mergeExternals: true,
    }),
  ],
};
