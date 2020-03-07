import ytpl from 'ytpl'
import RSS from 'rss'
import { NowRequest, NowResponse } from '@now/node'

// type YtInfo = {
//     id: string;
//     url: string;
//     url_simple: string;
//     title: string;
//     thumbnail: string;
//     duration: string;
//     author: {
//         id: string;
//         name: string;
//         user: string;
//         channel_url: string;
//         user_url: string;
//     };
// }


function ytGet(query): Promise<ytpl.result> {
    return ytpl(query, { limit: 100 })
        
}

const flatten = arr => [].concat(...arr);

//ZEIT Smart CDN should not allow this to be called more than once per hour, so no caching here
function getPlaylistItems({ selfURL, q }) {
    return Promise.resolve(q)
        .then(ytGet)
        .then((info) => {
            const items = flatten(info.items);
            let feed = new RSS({
                title: `${info.title} - ${info.author.name}`,
                description: 'Handsfree youtube feed',
                feed_url: `${selfURL}api/feed?q=`,
                ttl: '60',
                custom_namespaces: {
                    'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
                },
                custom_elements: [
                    //TODO add more podcast specific info
                ]
            })

            items.forEach(item => {
                feed.item({
                    title: item.title,
                    enclosure: { url: `${selfURL}api/yt?v=${item.id}`, type: 'audio/mp4', length: 60 },
                    url: `${selfURL}api/yt?v=${item.id}`,
                })
            })

            return feed.xml();
        })
}

export default (req: NowRequest, res: NowResponse) => {
    const selfURL = `https://${req.headers.host}/`
    if(!req.query.q){
        return res.send(`
        <form method="GET">
        playlist id or playlist/user/channel url: <input type="text" name="q" />
        </form>
        `)
    }

    return getPlaylistItems({ selfURL, q: req.query.q }).then(feedXML => {
        res.setHeader('content-type', 'application/rss+xml')
        res.setHeader('cache-control', 's-maxage=3600')
        res.send(feedXML)
    })
}
