'use strict';
const { isObject } = require('../utils/utils')
const path = require('path');
const pathExists = require('path-exists').sync
const fse = require('fs-extra')
const { getLatestVersion } = require('../utils/npm-info')
const npmInstall = require('npminstall')
const { CLI_NPM_REGISTRY } = global

class Package {
  constructor (options){
    if(!options){
      throw new Error('Package类的options参数不能为空')
    }
    if(!isObject(options)){
      throw new Error('Package类的options参数不是对象')
    }
    const { targetPath, storePath, pkgName, pkgVersion } = options
    		// package的路径
    this.targerPath = targetPath
    		// package的存储路径
    this.storePath = storePath
    		// package的名称
    this.pkgName = pkgName
    		// package的版本号
    this.pkgVersion = pkgVersion
        // package的缓存目录前缀
    this.cacheFilePathPrefix = pkgName.replace('/', '_')
  }

  // 完整缓存路径
  get cacheFilePath(){
    return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${this.pkgVersion}@${this.pkgName}`)
  }

  //指定版本号的依赖包路径
  getSpecificCacheFilePath(_pkgVersion){
    return path.resolve(this.storePath, `_${this.cacheFilePathPrefix}@${_pkgVersion}@${this.pkgName}`)
  }

  //package 准备工作
  async prepare(){
    if(this.storePath && !pathExists(this.storePath)){
      // 创建存储目录
      fse.mkdirpSync(this.storePath)
    }
    // 获取最新版本号
    if(this.pkgVersion === 'latest'){
      this.pkgVersion = await getLatestVersion(this.pkgName)
    }
  }

  // 判断模板是否存在
  async exists(){
    if(this.storePath){
      await this.prepare()
      return pathExists(this.cacheFilePath)
    } else {
      return pathExists(this.targerPath)
    }
  }

  // 安装包
  async install(){
    await this.prepare()
    await npmInstall({
      root: this.targerPath,
      storeDir: this.storePath,
      registry: CLI_NPM_REGISTRY,
      pkgs: [{name: this.pkgName,version: this.pkgVersion}
      ]
    })
  }

  // 更新包
  async update(){
    await this.prepare()
    // 获取依赖包最新版本号
    const latestVersion = await getLatestVersion(this.pkgName)
		// 拼接最新的依赖包缓存文件路径
		const latestFilePath = this.getSpecificCacheFilePath(latestVersion)
    if(!pathExists(latestFilePath)){
      await npmInstall({
        root: this.targerPath,
        storePath: this.storePath,
        registry: CLI_NPM_REGISTRY,
        pkgs: [{name:this.pkgName, version: latestVersion}]
      })
    }
  }
}

module.exports = Package