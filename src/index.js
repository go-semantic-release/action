const fs = require('fs').promises
const os = require('os')

const core = require('@actions/core')
const exec = require('@actions/exec')
const tc = require('@actions/tool-cache')
const SemVer = require('semver/classes/semver')

function getPlatformArch (a, p) {
  const platform = {
    win32: 'windows'
  }
  const arch = {
    x64: 'amd64',
    x32: '386'
  }
  return (platform[p] ? platform[p] : p) + '/' + (arch[a] ? arch[a] : a)
}

async function installer (version) {
  core.info(`downloading semantic-release@${version || 'latest'}`)
  const v = version ? `/${version}` : ''
  const path = await tc.downloadTool(`https://get-release.xyz/semantic-release/${getPlatformArch(os.arch(), os.platform())}${v}`)
  await fs.chmod(path, '0755')
  return path
}

async function main () {
  try {
    const changelogFile = core.getInput('changelog-file') || '.generated-go-semantic-release-changelog.md'
    const args = ['--version-file', '--changelog', changelogFile]
    if (core.getInput('github-token')) {
      args.push('--token')
      args.push(core.getInput('github-token'))
    }
    if (core.getInput('prerelease')) {
      args.push('--prerelease')
    }
    if (core.getInput('dry')) {
      args.push('--dry')
    }
    if (core.getInput('update-file')) {
      args.push('--update')
      args.push(core.getInput('update-file'))
    }
    if (core.getInput('ghr')) {
      args.push('--ghr')
    }
    if (core.getInput('allow-initial-development-versions')) {
      args.push('--allow-initial-development-versions')
    }
    if (core.getInput('force-bump-patch-version')) {
      args.push('--force-bump-patch-version')
    }
    if (core.getInput('changelog-generator-opt')) {
      const changelogOpts = core.getInput('changelog-generator-opt').split(',').filter(String)
      for (let idx = 0; idx < changelogOpts.length; idx++) {
        args.push('--changelog-generator-opt')
        args.push(changelogOpts[idx])
      }
    }
    const binPath = await installer('^2.5.0')
    try {
      core.info('running semantic-release...')
      await exec.exec(binPath, args)
    } catch (error) {
      if (/exit code 6\d/.test(error.message)) {
        return
      }
      core.setFailed(error.message)
      return
    }
    const generatedChangelog = (await fs.readFile(changelogFile)).toString('utf8')
    const versionFilename = (core.getInput('dry')) ? '.version-unreleased' : '.version'
    const version = (await fs.readFile(versionFilename)).toString('utf8')
    await fs.unlink(versionFilename)
    const parsedVersion = new SemVer(version)
    core.setOutput('changelog', generatedChangelog)
    core.debug(`setting version to ${parsedVersion.version}`)
    core.setOutput('version', parsedVersion.version)
    core.setOutput('version_major', `${parsedVersion.major}`)
    core.setOutput('version_minor', `${parsedVersion.minor}`)
    core.setOutput('version_patch', `${parsedVersion.patch}`)
    core.setOutput('version_prerelease', parsedVersion.prerelease.join('.'))
  } catch (error) {
    core.setFailed(error.message)
  }
}

main()
