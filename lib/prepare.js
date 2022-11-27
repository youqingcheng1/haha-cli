'use strict';

const pkg = require('../package.json')
const log = require('../utils/log')
const semver = require('semver')
const colors = require('colors')
const userHome = require('user-home')
const pathExists = require('path-exists')
const { LOWEST_NODE_VERSION } = require('../config/const')

function prepare (){
    checkPkgVersion()
    checkNodeVersion()
    checkUserHome()
}

// 打印脚手架版本号
function checkPkgVersion(){
    log.info(`${pkg.version}\n`)
}

//检查最低限制node版本
function checkNodeVersion(){
    const currentNode = process.version
    if(!semver.gte(currentNode, LOWEST_NODE_VERSION)){
        throw new Error(colors.red(`haha-cli 需要 v${LOWEST_NODE_VERSION} 版本的 Node`))
    }
}

// 检查当前用户主目录存不存在
function checkUserHome(){
    if(!userHome || !pathExists.sync(userHome)){
        throw new Error(colors.red('当前用户主目录不存在'))
    }
}

module.exports = prepare