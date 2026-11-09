// Checks that a `npm run build:netlify` output works when served from the site
// root: nothing may point at the GitHub Pages sub-path.
//
// Usage: npm run build:netlify && npm run check:netlify
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const GITHUB_PAGES_BASE = '/money-management/'
const distFile = (name) => fileURLToPath(new URL(`../dist/${name}`, import.meta.url))

const problems = []

async function readDist(name) {
  try {
    return await readFile(distFile(name), 'utf8')
  } catch {
    problems.push(`dist/${name} is missing. Run "npm run build:netlify" first.`)
    return undefined
  }
}

const html = await readDist('index.html')
if (html !== undefined) {
  if (html.includes(GITHUB_PAGES_BASE)) {
    problems.push(`dist/index.html still contains ${GITHUB_PAGES_BASE}`)
  }

  // The entry script must be root-absolute so Netlify can also serve a page
  // reached through a nested URL.
  const entry = /<script[^>]+src="([^"]+)"/.exec(html)?.[1]
  if (entry === undefined) {
    problems.push('dist/index.html has no module script tag')
  } else if (!entry.startsWith('/assets/')) {
    problems.push(`dist/index.html entry script is not root-absolute: ${entry}`)
  }
}

// The PWA must resolve from the root as well: manifest start_url/scope, icon
// URLs and the service-worker precache list are all base-relative.
const manifest = await readDist('manifest.webmanifest')
if (manifest !== undefined && manifest.includes(GITHUB_PAGES_BASE)) {
  problems.push(`dist/manifest.webmanifest still contains ${GITHUB_PAGES_BASE}`)
}

const serviceWorker = await readDist('sw.js')
if (serviceWorker !== undefined && serviceWorker.includes(GITHUB_PAGES_BASE)) {
  problems.push(`dist/sw.js still contains ${GITHUB_PAGES_BASE}`)
}

if (problems.length > 0) {
  console.error('Netlify build check FAILED:')
  for (const problem of problems) {
    console.error(`  - ${problem}`)
  }
  process.exitCode = 1
} else {
  console.log('Netlify build check passed: dist/ is served from the site root.')
}
