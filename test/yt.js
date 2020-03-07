const ytpl = require('ytpl')
const ytdl = require('ytdl-core')
const assert = require('assert')

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
        assert(vid)
        assert(vid.formats)
        assert(vid.formats[0])
        assert(vid.formats[0].url)

        console.log('ok')
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

youtubeToolsTest()