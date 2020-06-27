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
    const args = ['--vf']
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
    if (core.getInput('changelog-file')) {
      args.push('--changelog')
      args.push(core.getInput('changelog-file'))
    }
    if (core.getInput('allow-initial-development-versions')) {
      args.push('--allow-initial-development-versions')
    }
    if (core.getInput('allow-no-changes')) {
      args.push('--allow-no-changes')
    }
    const binPath = await installer('^1.22.0')
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
    const version = (await fs.readFile('.version')).toString('utf8')
    await fs.unlink('.version')
    const parsedVersion = new SemVer(version)
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
