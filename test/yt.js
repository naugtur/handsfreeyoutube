const ytpl = require('ytpl')
const ytdl = require('@distube/ytdl-core')
const assert = require('assert')
const axios = require('axios')

function getVidInfo(vid) {
    return ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`)
        .then(info => {
            const formats = ytdl.filterFormats(info.formats, 'audioonly')
            const prefered = formats.filter(f => f.container.match(/mp4|m4a/))[0]
            return prefered || formats[0]
        })
}

const youtubeToolsTest = async () => {
    try {

        const playlist = await ytpl('PLRSGEZKuzW-5VWfGU8FuYTNV1rd6p7-7C', { limit: 1 })
        assert(playlist)
        assert(playlist.items)
        assert(playlist.items[0])
        assert(playlist.items[0].url)
        assert(playlist.items[0].title)
        assert(playlist.items[0].id)

        const vid = await ytdl.getInfo(`https://www.youtube.com/watch?v=${playlist.items[0].id}`)
        console.log(ytdl.filterFormats(vid.formats, 'audioonly'), `https://www.youtube.com/watch?v=${playlist.items[0].id}`)
        assert(vid)
        assert(vid.formats)
        assert(vid.formats[0])
        assert(vid.formats[0].url)

        const re = await axios({
            url: vid.formats[0].url,
            responseType: 'stream',
            method: 'get'
        })
        assert(re.status===200)

        console.log('ok')
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

youtubeToolsTest()