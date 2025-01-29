function splitLine(line) {
    if (line.indexOf(" ") == -1) {
        return [line]
    }

    const args = []
    let current = ""
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
        const c = line[i]
        if (c == '"') {
            inQuotes = !inQuotes
        }
        else if (c == ' ' && !inQuotes) {
            args.push(current)
            current = ""
        }
        else {
            current += c
        }
    }
    args.push(current)
    return args
}

module.exports = async (cmdLine) => {
    const ExitHandler = require('../npm/lib/cli/exit-handler.js')
    const exitHandler = new ExitHandler({ process })
    const Npm = require('../npm/lib/npm.js')
    const npm = new Npm()
    exitHandler.setNpm(npm)
    exitHandler.registerUncaughtHandlers()

    try {
        await npm.load()

        if (cmdLine.length == 0) {
            console.log(npm.usage)
            return exitHandler.exit()
        }

        const args = splitLine(cmdLine)
        if (args[0].indexOf("npm") != -1) {
            args.shift()
        }
        const cmd = args.shift()
        if (!cmd) {
            console.log(`Unknown command: "${cmd}"\nTo see a list of supported npm commands, run:\n  npm help`)
            return exitHandler.exit()
        }

        const execPromise = npm.exec(cmd, args)

        await execPromise
        return exitHandler.exit()
    }
    catch (err) {
        if (err.code === 'EUNKNOWNCOMMAND') {
            console.log(`Bad command.\nTo see a list of supported npm commands, run:\n  npm help`)
            return exitHandler.exit(err)
        }
        console.log(`Error when executing npm command. ${err.message}\n\n${err.stack}\n`)
        return exitHandler.exit(err)
    }
}
