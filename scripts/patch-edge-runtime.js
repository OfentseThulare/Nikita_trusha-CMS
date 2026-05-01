/**
 * Patches next/dist/compiled/ua-parser-js/ua-parser.js to remove the
 * `__dirname` reference that crashes Vercel's Edge middleware runtime.
 *
 * Edge runtime defines __nccwpck_require__ but not __dirname, so the line
 *   if(typeof __nccwpck_require__!=="undefined")__nccwpck_require__.ab=__dirname+"/";
 * throws ReferenceError on every middleware invocation.
 */
const fs = require('fs')
const path = require('path')

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  'next',
  'dist',
  'compiled',
  'ua-parser-js',
  'ua-parser.js'
)

if (!fs.existsSync(target)) {
  console.log('[patch-edge-runtime] target not found, skipping:', target)
  process.exit(0)
}

const original = fs.readFileSync(target, 'utf8')
const needle = '__nccwpck_require__.ab=__dirname+"/"'
const replacement = '__nccwpck_require__.ab="/"'

if (!original.includes(needle)) {
  if (original.includes(replacement)) {
    console.log('[patch-edge-runtime] already patched')
  } else {
    console.log('[patch-edge-runtime] needle not found, skipping')
  }
  process.exit(0)
}

const patched = original.replace(needle, replacement)
fs.writeFileSync(target, patched, 'utf8')
console.log('[patch-edge-runtime] patched ua-parser.js for Edge runtime')
