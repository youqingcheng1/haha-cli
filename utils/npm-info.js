'use strict';
const axios = require('axios')
// 将所有参数连接在一起并规范化生成的 URL
const urlJoin = require('url-join')
// npm 的语义版本器
const semver = require('semver')

// 获取默认的镜像地址
function getDefaultNpmRegistry (registry) {
  return registry ? registry : 'https://registry.npm.taobao.org'
}

// 获取npm 信息
async function getNpmInfo(npmName, registry = 'http://10.0.0.208:4873/-/verdaccio/data/sidebar/') {
  if (!npmName) return null
  const baseUrl = getDefaultNpmRegistry(registry)
  const fullPath = urlJoin(baseUrl, npmName)
  return axios.get(fullPath).then(res => {
    if (res.status === 200) {
      return res.data
    }
    return null
  }).catch(err => {
    return Promise.reject(err)
  })
}

// 获取版本信息
async function getNpmVersion(baseVersion, npmName, registry = 'http://10.0.0.208:4873/-/verdaccio/data/sidebar') {
  registry = getDefaultNpmRegistry(registry)
  try {
    const data = await getNpmInfo(npmName, registry)
    if (data && data.versions) {
      return getSemverVersions(baseVersion, Object.keys(data.versions))
    } else {
      return []
    }
  } catch (error) {
    console.log(error)
    return null
  }
}

// 获取最新的版本号
function getSemverVersions (baseVersion, versions) {
  let newVersions = versions.filter(e => semver.gt(e, `${baseVersion}`))
  newVersions.sort((a, b) => {
    if (semver.gt(b, a)) {
      return 0
    } else {
      return -1
    }    
  })
  if (newVersions.length) {
    return newVersions[0]
  } else {
    return null
  }
}

// 获取最新版本
async function getLatestVersion (npmName, registry = 'http://10.0.0.208:4873/-/verdaccio/data/sidebar') {
  const data = await getNpmInfo(npmName, registry)
  let versions = data.versions || {}
  versions = Object.keys(versions)
  if (versions) {
    versions.sort((a, b) => {
      if (semver.gt(b, a)) {
        return 0
      } else {
        return -1
      }    
    })
    return versions[0]
  }
  return null
}

module.exports = {
  getNpmVersion,
  getLatestVersion,
  getDefaultNpmRegistry
}