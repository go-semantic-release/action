import { promises as fs } from 'fs'
import { arch, platform } from 'os'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'
import { SemVer } from 'semver'

function getPlatformArch (a: string, p: string): string {
  const platform = {
    win32: 'windows'
  }
  const arch = {
    x64: 'amd64',
    x32: '386'
  }
  return (platform[p] ? platform[p] : p) + '/' + (arch[a] ? arch[a] : a)
}

async function installLatestSemRelVersion (): Promise<string> {
  core.info('downloading semantic-release binary...')
  const path = await tc.downloadTool(`https://registry.go-semantic-release.xyz/downloads/${getPlatformArch(arch(), platform())}/semantic-release`)
  await fs.chmod(path, '0755')
  return path
}

function getBooleanInput (name: string): boolean {
  const inputValue = core.getInput(name)
  if (!inputValue) return false
  try {
    return core.getBooleanInput(name)
  } catch (e) {
    core.warning(e)
    core.warning(`assuming for input '${name}' that the value '${inputValue}' is true`)
    return true
  }
}

async function main (): Promise<void> {
  try {
    const changelogFile = core.getInput('changelog-file') || '.generated-go-semantic-release-changelog.md'
    let args = ['--version-file', '--changelog', changelogFile]
    if (core.getInput('github-token')) {
      args.push('--token')
      args.push(core.getInput('github-token'))
    }
    if (getBooleanInput('prerelease')) {
      args.push('--prerelease')
    }
    if (getBooleanInput('prepend')) {
      args.push('--prepend-changelog')
    }
    if (getBooleanInput('dry')) {
      args.push('--dry')
    }
    if (core.getInput('update-file')) {
      args.push('--update')
      args.push(core.getInput('update-file'))
    }
    if (getBooleanInput('ghr')) {
      args.push('--ghr')
    }
    if (getBooleanInput('allow-initial-development-versions')) {
      args.push('--allow-initial-development-versions')
    }
    if (getBooleanInput('force-bump-patch-version')) {
      args.push('--force-bump-patch-version')
    }
    if (core.getInput('changelog-generator-opt')) {
      const changelogOpts = core.getInput('changelog-generator-opt').split(',').filter(String)
      for (let idx = 0; idx < changelogOpts.length; idx++) {
        args.push('--changelog-generator-opt')
        args.push(changelogOpts[idx])
      }
    }
    if (core.getInput('hooks')) {
      args.push('--hooks')
      args.push(core.getInput('hooks'))
    }
    if (core.getInput('custom-arguments')) {
      args = args.concat(core.getInput('custom-arguments').split(' ').filter(String))
    }

    let binPath = core.getInput('bin')
    if (!binPath) binPath = await installLatestSemRelVersion()

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
    const versionFilename = (core.getBooleanInput('dry')) ? '.version-unreleased' : '.version'
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
