import ytdl from 'ytdl-core'
import { safeMemoryCache } from 'safe-memory-cache'
import { NowRequest, NowResponse } from '@now/node'

const cache = safeMemoryCache({
    limit: 100
})

function getVidInfo(vid) {
    let ytInfo = cache.get(vid)
    if (!ytInfo) {
        console.log(`populating cache for ${vid}`)
        ytInfo = ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`)
            .then(info => {
                const formats = ytdl.filterFormats(info.formats, 'audioonly')
                const prefered = formats.filter(f => f.container.match(/mp4|m4a/))[0]
                return prefered || formats[0]
            })
        cache.set(vid, ytInfo)
    } else {
        console.log(`using cache for ${vid}`)
    }
    return ytInfo
}

export default (req: NowRequest, res: NowResponse) => {
    const vid = req.query.v
    if (!vid) {
        res.status(404).end()
    }
    return getVidInfo(vid)
        .then(audioInfo => {
            if (!audioInfo) {
                console.log(`no audio matches for ${vid}`)
                return res.status(404).end()
            }
            console.log(audioInfo)
            res.status(302).setHeader('location', audioInfo.url)
            res.end()
        })
}