module.exports = function() {
  const config = require('../config');
  this.processJsonSubreddit = (json, from, subreddit_front) => {
    return new Promise(resolve => {
      (async () => {
        if(from === 'redis') {
          json = JSON.parse(json)
        }
        if(json.error) {
          resolve({ error: true, error_data: json })
        } else {
          let before = json.data.before
          let after = json.data.after
          
          let ret = {
            info: {
              before: before,
              after: after
            },
            links: []
          }
          
          let children_len = json.data.children.length
          
          for(var i = 0; i < children_len; i++) {
            let data = json.data.children[i].data
            let images = null
            let is_self_link = false
            let valid_reddit_self_domains = ['reddit.com']

            if(data.domain) {
              let tld = data.domain.split('self.')
              if(tld.length > 1) {
                if(!tld[1].includes('.')) {
                  is_self_link = true
                }
              }
              if(config.valid_media_domains.includes(data.domain) || valid_reddit_self_domains.includes(data.domain)) {
                is_self_link = true
              }
            }
            
            if(data.preview && data.thumbnail !== 'self') {
              if(!data.url.startsWith('/r/') && isGif(data.url)) {
                images = {
                  thumb: await downloadAndSave(data.thumbnail, 'thumb_')
                }
              } else {
                if(data.preview.images[0].resolutions[0]) {
                  images = {
                    thumb: await downloadAndSave(data.preview.images[0].resolutions[0].url, 'thumb_')
                  }
                }
              }
            }
            let obj = {
              author: data.author,
              created: data.created_utc,
              domain: data.domain,
              id: data.id,
              images: images,
              is_video: data.is_video,
              locked: data.locked,
              media: data.media,
              num_comments: data.num_comments,
              permalink: data.permalink,
              score: data.score,
              subreddit: data.subreddit,
              title: data.title,
              ups: data.ups,
              upvote_ratio: data.upvote_ratio,
              url: data.url,
              is_self_link: is_self_link,
              subreddit_front: subreddit_front,
              before: before,
              after: after
            }
            ret.links.push(obj)
          }
          resolve(ret)
        }
      })()
    })
  }
}
