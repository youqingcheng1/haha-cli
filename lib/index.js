'use strict';

const registerCommands = require('./registerCommands')
const prepare = require('./prepare')

console.log('node process.cwd', process.cwd())

function core (){
    prepare()
    registerCommands()
}

core()

