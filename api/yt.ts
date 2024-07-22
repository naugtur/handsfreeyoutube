// @ts-check
import ytdl from '@distube/ytdl-core'
import { VercelRequest, VercelResponse } from '@vercel/node'



function getVidInfo(vid) {
    return ytdl.getInfo(`https://www.youtube.com/watch?v=${vid}`)
        .then(info => {
            const formats = ytdl.filterFormats(info.formats, 'audioonly')
            const prefered = formats.filter(f => f.container.match(/mp4|m4a/))[0]
            return prefered || formats[0]
        })
}

export default (req: VercelRequest, res: VercelResponse) => {
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
        .catch(err => {
            res.status(500)
            console.log(err.stack)
            res.send(err.message)
            res.end()
        })
}