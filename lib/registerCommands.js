const { Command } = require('commander')
const pkg = require('../package.json')
const log = require('../utils/log')
const colors = require('colors')
const { argv } = require('process')
const { create } = require('../commands')

// 实例化commander 负责将参数解析为选项和命令参数
const program = new Command()

// 注册文件
function registerCommands () {
    try{
        program
            .name(Object.keys(pkg.bin)[0])
            .usage('<command> [options]')
            .version(pkg.version)
            .option('-d, --debug', '是否开启debug模式', true)
            .option('-tp, --targetPath <targetPath>', '是否指定本地调试文件路径', '')
        
        // 自定义项目
        program
            .command('create [projectName]')
            .option('-f, --force', '是否强制初始化项目')
            .description('初始化项目')
            .action(create)

        program
            .on('option:debug', function(){
                process.env.CLI_LOG_LEVEL = 'verbose'
                log.level = process.env.CLI_LOG_LEVEL
            })
        program
            .on('option:targetPath', function(pathStr){
                process.env.CLI_TARGET_PATH = pathStr
            })
        
        program.on('command:*', function(obj) {
            const avaliableCommands = program.commands.map(cmd => cmd.name())
            log.error(colors.red('未知的命令: ' + obj[0]));
            if(avaliableCommands.length > 0){
                log.info(colors.yellow('可用命令：' + avaliableCommands.join(',')))
            }
        })

        // 解析命令参数
        program.parse(argv)

    }catch(error){
        log.error(error)
		if (program.debug) {
			log.info(program.debug)
		}
    }
}

module.exports = registerCommands