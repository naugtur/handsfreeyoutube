const ytpl = require('ytpl')
const ytdl = require('ytdl-core')
const assert = require('assert')
const axios = require('axios')


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
        console.log(vid)
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