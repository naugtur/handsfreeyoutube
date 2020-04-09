import ytsr from 'ytsr'
import RSS from 'rss'
import { NowRequest, NowResponse } from '@now/node'

function ytGet(query): Promise<any> {
    return ytsr.getFilters(query).then(filters => {
        const filter = filters.get('Type').find(o => o.name === 'Video');
        return ytsr(null, { limit: 20, safeSearch: true, nextpageRef: filter.ref })
    })

}

const flatten = arr => [].concat(...arr);

function getResults({ selfURL, q }) {
    return Promise.resolve(q)
        .then(ytGet)
        .then((info) => {
            console.log(info)
            const items = flatten(info.items);
            let feed = new RSS({
                title: `yt: ${q}`,
                description: `${q} - handsfree youtube search`,
                feed_url: `${selfURL}`,
                ttl: '60',
                custom_namespaces: {
                    'itunes': 'http://www.itunes.com/dtds/podcast-1.0.dtd'
                },
                custom_elements: [
                    //TODO add more podcast specific info
                ]
            })

            items.forEach(item => {
                const id = item.link.replace('https://www.youtube.com/watch?v=', '')
                feed.item({
                    title: item.title,
                    enclosure: { url: `${selfURL}api/yt?v=${id}`, type: 'audio/mp4', length: 60 },
                    url: `${selfURL}api/yt?v=${id}`,
                    custom_elements: [
                        {
                            'itunes:image': {
                                _attr: {
                                    href: item.thumbnail
                                }
                            }
                        }
                    ]
                })
            })

            return feed.xml();
        })
}

export default (req: NowRequest, res: NowResponse) => {
    const selfURL = `https://${req.headers.host}/`
    if (!req.query.q) {
        return res.send(`
        <form method="GET">
        search youtube <input type="text" name="q" />
        </form>
        `)
    }

    return getResults({ selfURL, q: req.query.q }).then(feedXML => {
        res.setHeader('content-type', 'application/rss+xml')
        res.setHeader('cache-control', 's-maxage=3600')
        res.send(feedXML)
    })
}
