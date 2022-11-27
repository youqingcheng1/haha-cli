// 命令行交互工具
const inquirer = require('inquirer')
// 集成了fs，拓展。文件操作
const fse = require('fs-extra')
const { isEmptyDir } = require('../utils/utils')
const axios = require('axios')


async function init(){
    // npm上的模板包列表
    this.npmList = []
    // 当前选择的项目模板名称
    this.currentTtemplateName = ''

    try{
        // 准备阶段
		await prepare()
        await downloadTemplate()

    }catch(e){
        console.log(e)
    }
}


async function prepare(){
    // 当前目录是否为空
    const isEmpty = isEmptyDir()
    let isContinue = false
    if (!isEmpty) {
        isContinue = (
            await inquirer.prompt([
                {
                    type: 'confirm',
                    name: 'isContinue',
                    default: false,
                    message: '当前文件夹不为空，是否继续创建项目？'
                }
            ])).isContinue
        if (!isContinue) {
            process.exit(1)
        }
        if (isContinue) {
            const { isClear } = await inquirer.prompt([
                    {
                        type: 'confirm',
                        name: 'isClear',
                        default: false,
                        message: '是否清空文件夹？'
                    }
                ])
                if (isClear) {
                    fse.emptyDirSync(process.cwd())
                }
        }
    }
    getAllTemplate()
}

// 选择模板
async function getAllTemplate(){
    const { data } = await axios.get('http://10.0.0.208:4873/-/verdaccio/data/packages')
    this.npmList = data || []
    const templateALl = this.npmList.map(r => ({name:r.name, value:r.name})).filter(e => /^\@template/.test(e.name))
    const { templateName } = await inquirer.prompt([
        {
            type: 'list',
            message: '请选择项目模板',
            name: 'templateName',
            default: templateALl[0].value,
            choices: templateALl
        }
    ])
    this.currentTtemplateName = templateName
}

// 下载模板
async function downloadTemplate (){}

module.exports = init