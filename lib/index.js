'use strict';
const registerCommands = require('./registerCommands')
const prepare = require('./prepare')

function core (){
    prepare()
    registerCommands()
}

core()

