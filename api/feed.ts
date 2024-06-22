import ytpl from 'ytpl'
import { guess } from '../lib/ytpl-guess'
import RSS from 'rss'
import { VercelRequest, VercelResponse } from '@vercel/node'

interface ytMinimum {
    title: string;
    author: null | {
        name: string;
    };
    items: {
        id: string;
        title: string;
        thumbnail: string;
    }[];
}

function ytGet(query): Promise<ytpl.Result> {
    return ytpl(query, { limit: 100 })
}

function ytFallback(query): Promise<ytMinimum> {
    return guess(query)
}

const flatten = arr => [].concat(...arr);

//ZEIT Smart CDN should not allow this to be called more than once per hour, so no caching here
function getPlaylistItems({ selfURL, q }) {
    return Promise.resolve(q)
        .then(ytGet)
        .catch(e => {
            console.error('oops', e)
            return ytFallback(q)
        })
        .then((info) => {
            console.log(info)
            const items = flatten(info.items);
            let title = "No title found"
            try {
                title = info.title;
                title = `${info.title} - ${info.author.name}`
            } catch (e) { }
            let feed = new RSS({
                title: title,
                description: 'Handsfree youtube feed',
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
                feed.item({
                    title: item.title,
                    enclosure: { url: `${selfURL}api/yt?v=${item.id}`, type: 'audio/mp4', length: 60 },
                    url: `${selfURL}api/yt?v=${item.id}`,
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

export default (req: VercelRequest, res: VercelResponse) => {
    const selfURL = `https://${req.headers.host}/`
    if (!req.query.q) {
        return res.send(`
        <form method="GET">
        playlist id or playlist/user/channel url: <input type="text" name="q" />
        </form>
        `)
    }

    return getPlaylistItems({ selfURL, q: req.query.q }).then(feedXML => {
        res.setHeader('content-type', 'application/rss+xml')
        res.setHeader('cache-control', 's-maxage=60')
        res.send(feedXML)
    })
}
