const {contextBridge, ipcRenderer} = require('electron')
const path = require('path')
const getLinuxSources = require(path.join(__dirname, './audio_manager/linux.js'));
contextBridge.exposeInMainWorld('platform' , {
    os:process.platform 

})
contextBridge.exposeInMainWorld('source' , {
    getSources :async() => await getLinuxSources()
})

contextBridge.exposeInMainWorld('recorder', {
    start: (micSource) => ipcRenderer.invoke('start-recording', micSource),
    stop: () => ipcRenderer.invoke('stop-recording'),
    enhanceNotes: (audioPath, notes) => ipcRenderer.invoke('enhance-notes', { audioPath, notes })
})