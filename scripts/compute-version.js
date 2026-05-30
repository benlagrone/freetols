#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SEMVER_PATTERN =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

function isValidSemver(version) {
  return SEMVER_PATTERN.test(version);
}

function readPackageVersion(packageJsonPath = path.resolve(__dirname, '..', 'package.json')) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  return packageJson.version;
}

function getTagName(ref = '', refName = '') {
  if (ref.startsWith('refs/tags/')) {
    return ref.slice('refs/tags/'.length);
  }
  if (!ref && /^v?\d+\.\d+\.\d+/.test(refName)) {
    return refName;
  }
  return '';
}

function normalizeReleaseVersion(tagName) {
  return tagName.startsWith('v') ? tagName.slice(1) : tagName;
}

function computeVersion(options = {}) {
  const packageVersion = options.packageVersion || readPackageVersion(options.packageJsonPath);
  const ref = options.ref || process.env.GITHUB_REF || '';
  const refName = options.refName || process.env.GITHUB_REF_NAME || '';
  const sha = (options.sha || process.env.GITHUB_SHA || 'localdev').trim();
  const runNumber = String(options.runNumber || process.env.GITHUB_RUN_NUMBER || '0').trim();

  if (!isValidSemver(packageVersion)) {
    throw new Error(`package.json version must be valid SemVer, got "${packageVersion}"`);
  }

  if (packageVersion.includes('-') || packageVersion.includes('+')) {
    throw new Error(
      `package.json version must be a stable release base before deriving dev versions, got "${packageVersion}"`,
    );
  }

  if (!/^\d+$/.test(runNumber)) {
    throw new Error(`run number must be numeric, got "${runNumber}"`);
  }

  const shortSha = (sha || 'localdev').slice(0, 7).toLowerCase();
  const tagName = getTagName(ref, refName);

  if (tagName) {
    const releaseVersion = normalizeReleaseVersion(tagName);
    if (!isValidSemver(releaseVersion)) {
      throw new Error(`release tag must be valid SemVer, got "${tagName}"`);
    }
    if (releaseVersion !== packageVersion) {
      throw new Error(
        `release tag "${releaseVersion}" must match package.json version "${packageVersion}"`,
      );
    }

    return {
      baseVersion: packageVersion,
      version: releaseVersion,
      channel: 'release',
      isRelease: true,
      shouldTagLatest: true,
      shortSha,
      ref,
      refName,
      tagName,
    };
  }

  return {
    baseVersion: packageVersion,
    version: `${packageVersion}-dev.${runNumber}.sha.${shortSha}`,
    channel: 'dev',
    isRelease: false,
    shouldTagLatest: false,
    shortSha,
    ref,
    refName,
    tagName: '',
  };
}

function toGithubOutput(result) {
  return [
    `base_version=${result.baseVersion}`,
    `version=${result.version}`,
    `channel=${result.channel}`,
    `is_release=${String(result.isRelease)}`,
    `should_tag_latest=${String(result.shouldTagLatest)}`,
    `short_sha=${result.shortSha}`,
    `tag_name=${result.tagName}`,
  ].join('\n');
}

function main() {
  const args = new Set(process.argv.slice(2));
  const result = computeVersion();

  if (args.has('--github-output')) {
    process.stdout.write(`${toGithubOutput(result)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  }
}

module.exports = {
  computeVersion,
  isValidSemver,
  normalizeReleaseVersion,
  readPackageVersion,
  toGithubOutput,
};
