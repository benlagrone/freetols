const test = require('node:test');
const assert = require('node:assert/strict');

const { computeVersion } = require('./compute-version');

test('derives a SemVer prerelease for dev commits', () => {
  const result = computeVersion({
    packageVersion: '0.1.0',
    ref: 'refs/heads/main',
    refName: 'main',
    sha: 'abcdef1234567890',
    runNumber: '42',
  });

  assert.deepEqual(result, {
    baseVersion: '0.1.0',
    version: '0.1.0-dev.42.sha.abcdef1',
    channel: 'dev',
    isRelease: false,
    shouldTagLatest: false,
    shortSha: 'abcdef1',
    ref: 'refs/heads/main',
    refName: 'main',
    tagName: '',
  });
});

test('uses tagged releases as the final SemVer version', () => {
  const result = computeVersion({
    packageVersion: '1.2.3',
    ref: 'refs/tags/v1.2.3',
    refName: 'v1.2.3',
    sha: '1234567890abcdef',
    runNumber: '84',
  });

  assert.deepEqual(result, {
    baseVersion: '1.2.3',
    version: '1.2.3',
    channel: 'release',
    isRelease: true,
    shouldTagLatest: true,
    shortSha: '1234567',
    ref: 'refs/tags/v1.2.3',
    refName: 'v1.2.3',
    tagName: 'v1.2.3',
  });
});

test('does not treat non-tag branch names as releases', () => {
  const result = computeVersion({
    packageVersion: '1.2.3',
    ref: 'refs/heads/release-hardening',
    refName: 'release-hardening',
    sha: 'fedcba9876543210',
    runNumber: '99',
  });

  assert.equal(result.channel, 'dev');
  assert.equal(result.version, '1.2.3-dev.99.sha.fedcba9');
  assert.equal(result.isRelease, false);
});

test('rejects release tags that do not match package.json', () => {
  assert.throws(
    () =>
      computeVersion({
        packageVersion: '1.2.3',
        ref: 'refs/tags/v1.2.4',
        refName: 'v1.2.4',
        sha: '1234567890abcdef',
        runNumber: '84',
      }),
    /must match package\.json version/,
  );
});
