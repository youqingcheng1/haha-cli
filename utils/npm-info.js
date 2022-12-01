'use strict';
const axios = require('axios')
// 将所有参数连接在一起并规范化生成的 URL
const urlJoin = require('url-join')
// npm 的语义版本器
const semver = require('semver')
const { CLI_NPM_API_PAKDATA } = global

// 获取npm 信息
async function getNpmInfo(npmName) {
  if (!npmName) return null
  const fullPath = urlJoin(CLI_NPM_API_PAKDATA, npmName)
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
async function getNpmVersion(baseVersion, npmName) {
  try {
    const data = await getNpmInfo(npmName)
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
async function getLatestVersion (npmName) {
  const data = await getNpmInfo(npmName)
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
  getLatestVersion
}