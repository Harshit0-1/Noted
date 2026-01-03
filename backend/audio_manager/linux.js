const {execSync} = require('child_process')
// const arguments = ['pactl list sources short' , '']
 const  getLinuxSources = () => {
    const sourcesRaw = execSync('pactl list sources short').toString()
    const sources = sourcesRaw.trim().split('\n').map((line) =>  line.split('\t')[1])
    console.log(sources)
    const monitorSources = sources.filter((line) => line.endsWith('.monitor')) || null 
    console.log("this are the sinks : " , monitorSources)
    if(!monitorSources){
        console.warn("No monitor sources are found system audio will not be capture")
    }

    const micSource = sources.filter((source) => !source.endsWith('.monitor'))
    console.log("this is the mic source : " , micSource)
    return micSource
}
module.exports = getLinuxSources
