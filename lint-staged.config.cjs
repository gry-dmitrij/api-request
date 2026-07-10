module.exports = {
  // Lint staged TS/TSX/JS/JSX sources (never the build output in dist).
  '!(dist/**/*).{ts,tsx,js,jsx}': (filenames) =>
    `eslint --max-warnings=0 ${filenames.join(' ')}`,
  // When any TS/TSX source is staged, type-check and run the whole unit test
  // suite. Returning a fixed command (no filenames) runs the suite once.
  '!(dist/**/*).{ts,tsx}': () => ['tsc --noEmit', 'vitest run'],
}
