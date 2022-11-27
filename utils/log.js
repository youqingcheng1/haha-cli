'use strict';

const npmlog = require('npmlog')
// 设置log的等级，默认只打印level 2000以上的日志
npmlog.level = 'info'
// 设置log的前缀
npmlog.heading = 'haha-cli'
npmlog.headingStyle = { fg: 'black', bg: 'white' }
// 添加自定义命令
npmlog.addLevel('warning', 2000, { fg: 'yellow', bold: true })
npmlog.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = npmlog

