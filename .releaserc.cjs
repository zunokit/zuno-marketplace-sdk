/**
 * Semantic Release Configuration
 *
 * Dynamically provides configuration based on the current branch:
 * - develop/develop-claude branches: Uses beta release configuration
 * - main branch: Uses production release configuration
 */

// Determine the current branch
const currentBranch = process.env.GITHUB_REF_NAME ||
                     process.env.GIT_BRANCH ||
                     (process.env.GITHUB_REF && process.env.GITHUB_REF.replace('refs/heads/', '')) ||
                     require('child_process')
                       .execSync('git rev-parse --abbrev-ref HEAD')
                       .toString()
                       .trim();

console.error(`[semantic-release] Branch: ${currentBranch}`);

// Beta release configuration
const betaConfig = {
  branches: [
    'main',  // Required even in beta config
    {
      name: 'develop',
      prerelease: 'beta'
    },
    {
      name: 'develop-claude',
      prerelease: 'beta-claude'
    }
  ],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
          { type: 'build', release: false },
          { type: 'ci', release: false },
          { type: 'chore', release: false },
          { breaking: true, release: 'major' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '✨ Features' },
            { type: 'fix', section: '🐛 Bug Fixes' },
            { type: 'perf', section: '⚡️ Performance Improvements' },
            { type: 'revert', section: '⏪️ Reverts' },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'docs', section: '📝 Documentation', hidden: true },
            { type: 'style', section: '💄 Styles', hidden: true },
            { type: 'test', section: '✅ Tests', hidden: true },
            { type: 'build', section: '📦 Build System', hidden: true },
            { type: 'ci', section: '👷 CI', hidden: true },
            { type: 'chore', section: '🔨 Chores', hidden: true }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    [
      '@semantic-release/github',
      {
        successComment: false,
        failComment: false
      }
    ]
  ]
};

// Production release configuration
const productionConfig = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommits',
        releaseRules: [
          { type: 'feat', release: 'minor' },
          { type: 'fix', release: 'patch' },
          { type: 'perf', release: 'patch' },
          { type: 'refactor', release: 'patch' },
          { type: 'docs', release: false },
          { type: 'style', release: false },
          { type: 'test', release: false },
          { type: 'build', release: false },
          { type: 'ci', release: false },
          { type: 'chore', release: false },
          { breaking: true, release: 'major' }
        ]
      }
    ],
    [
      '@semantic-release/release-notes-generator',
      {
        preset: 'conventionalcommits',
        presetConfig: {
          types: [
            { type: 'feat', section: '✨ Features' },
            { type: 'fix', section: '🐛 Bug Fixes' },
            { type: 'perf', section: '⚡️ Performance Improvements' },
            { type: 'revert', section: '⏪️ Reverts' },
            { type: 'refactor', section: '♻️ Code Refactoring' },
            { type: 'docs', section: '📝 Documentation', hidden: true },
            { type: 'style', section: '💄 Styles', hidden: true },
            { type: 'test', section: '✅ Tests', hidden: true },
            { type: 'build', section: '📦 Build System', hidden: true },
            { type: 'ci', section: '👷 CI', hidden: true },
            { type: 'chore', section: '🔨 Chores', hidden: true }
          ]
        }
      }
    ],
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md'
      }
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: true
      }
    ],
    [
      '@semantic-release/git',
      {
        assets: ['package.json', 'pnpm-lock.yaml', 'CHANGELOG.md'],
        message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
      }
    ],
    '@semantic-release/github'
  ]
};

// Select and export the appropriate configuration
const isBetaBranch = currentBranch === 'develop' || currentBranch === 'develop-claude';
const config = isBetaBranch ? betaConfig : productionConfig;

console.error(`[semantic-release] Using ${isBetaBranch ? 'BETA' : 'PRODUCTION'} config`);
console.error(`[semantic-release] Branches: ${JSON.stringify(config.branches)}`);

module.exports = config;
