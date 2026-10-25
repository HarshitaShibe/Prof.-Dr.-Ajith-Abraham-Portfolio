/* ==========================================================================
   Command-line options that work the same in every shell.

   PowerShell removes the "--" in `npm run x -- --email a@b.c`, so npm takes
   "--email" for one of its own settings and passes only "a@b.c" on. These
   forms all reach the script:

     npm run publications:links you@example.org
     npm run publications:links email=you@example.org limit=30
     node scripts/enrich-publications.mjs --email you@example.org --limit 30
     (and, outside PowerShell) npm run publications:links -- --email you@example.org
   ========================================================================== */

/**
 * Reads options from `--name value`, `--name=value`, `name=value`, or (when
 * npm swallowed the flag) from npm's npm_config_<name> environment variable.
 */
export function parseArgs(argv = process.argv.slice(2), env = process.env) {
  const get = (name) => {
    for (let i = 0; i < argv.length; i++) {
      const a = argv[i]
      if (a === `--${name}` && argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) return argv[i + 1]
      if (a.startsWith(`--${name}=`)) return a.slice(name.length + 3)
      if (a.startsWith(`${name}=`)) return a.slice(name.length + 1)
    }
    const fromNpm = env[`npm_config_${name.replace(/-/g, '_')}`]
    return fromNpm && fromNpm !== 'true' ? fromNpm : undefined
  }
  const has = (name) =>
    argv.includes(`--${name}`) || argv.includes(name) || env[`npm_config_${name.replace(/-/g, '_')}`] === 'true'

  // A bare word with an @ is the email address ("npm run publications:links you@example.org").
  const bareEmail = argv.find((a) => /^[^\s=@]+@[^\s=@]+\.[^\s=@]+$/.test(a))
  const email = get('email') ?? bareEmail
  return { get, has, email }
}
