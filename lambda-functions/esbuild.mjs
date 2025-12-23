import esbuild from 'esbuild'

const isWatch = process.argv.includes('--watch')

/** @type {import('esbuild').BuildOptions} */
const base = {
  entryPoints: ['src/handlers/api.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  sourcemap: true,
  outdir: 'dist',
  outExtension: { '.js': '.mjs' },
  external: ['@aws-sdk/*'],
}

if (isWatch) {
  const ctx = await esbuild.context(base)
  await ctx.watch()
  // eslint-disable-next-line no-console
  console.log('watching...')
} else {
  await esbuild.build(base)
}

