module.exports = function(tools) { 
  const config = require('../config')
  const {spawn} = require('child_process')
  const fs = require('fs')
  this.downloadAndSave = (url, file_prefix = '', gifmp4, isYouTubeThumbnail) => {
    /** 
    * This function downloads media (video or image) to disk.
    * Returns a localized URL
    * 
    * For example for images:
    * https://external-preview.redd.it/DiaeK_j5fqpBqbatvo7GZzbHNJY2oxEym93B_3.jpg
    * =>
    * https://teddit.net/pics/DiaeK_j5fqpBqbatvo7GZzbHNJY2oxEym93B_3.jpg
    *
    * For videos:
    * https://v.redd.it/f3lcdk4ydcl51/DASH_480.mp4?source=fallback
    * =>
    * https://teddit.net/vids/f3lcdk4ydcl51.mp4
    */
    let valid_video_extensions = ['mp4', 'webm', 'ogg']
    let invalid_urls = ['self', 'default', 'nsfw', 'image', 'spoiler', 'undefined', undefined, null, '']
    return new Promise((resolve, reject) => {
      if(!invalid_urls.includes(url)) {
        (async () => {
          let temp_url = new URL(url)
          if(config.valid_media_domains.includes(temp_url.hostname)) {
            let pathname = temp_url.pathname
            let file_ext
            let has_extension = true

            if(gifmp4) {
              file_ext = 'mp4'
            } else {
              if(!pathname.includes('.')) {
                /**
                * Sometimes reddit API returns video without extension, like
                * "DASH_480" and not "DASH_480.mp4".
                */
                file_ext = 'mp4'
                has_extension = false
              } else { 
                file_ext = pathname.substring(pathname.lastIndexOf('.') + 1)
              }
            }

            if(valid_video_extensions.includes(file_ext) || gifmp4) {
              /* Is video. */
              if(!config.video_enabled) {
                resolve('')
              } else {
                let filename = `${temp_url.pathname.substr(1).split('/')[0]}.${file_ext}`
                let path = `${__dirname}/../dist/vids/${filename}`
                let temp_path = `${__dirname}/../dist/vids/temp_${filename}`
                if(!fs.existsSync(path)) {
                  const download = await downloadFile(cleanUrl(url))
                  if(download.success === true) {
                    const write = await writeToDisk(download.data, temp_path)
                    if(write.success === true) {
                      let audio_url
                      if(has_extension) {
                        audio_url = `${url.split('_')[0]}_audio.mp4`
                      } else {
                        let ending = `${temp_url.pathname.split('/').slice(-1)[0]}`
                        audio_url = url.replace(ending, 'audio')
                      }
                      const download_audio = await downloadFile(cleanUrl(audio_url))
                      if(download_audio.success === true) {
                        let audio_path = `${__dirname}/../dist/vids/temp_audio_${filename}`
                        const write_audio = await writeToDisk(download_audio.data, audio_path)
                        if(write_audio.success === true) {
                          let processVideo = spawn('ffmpeg', ['-y', '-i', temp_path, '-i', audio_path, '-c', 'copy', path])
                          processVideo.on('exit', (code) => {
                            if(code === 0) {
                              let final_url = `${protocol}${config.domain}/vids/${filename}`
                              let temp_files = [temp_path, audio_path]
                              deleteFiles(temp_files, (error) => {
                                if(error) {
                                  console.log(`Error while deleting temporay files:`, error)
                                }
                              })
                              resolve(final_url)
                            } else {
                              console.log(`ffmpeg error, exited with code: `, code)
                              resolve('')
                            }
                          })
                        } else {
                          console.log(`Error while writing temp audio file.`)
                          resolve('')
                        }
                      } else {
                        /**
                        * Either the video doesn't have any audio track, or we
                        * failed downloading it. Let's return the video only.
                        */
                        fs.rename(temp_path, path, (error) => {
                          if(error) {
                            console.log(`Error while renaming the temp video file: ${temp_path} => ${path}.`, error)
                          } else {
                            let final_url = `${protocol}${config.domain}/vids/${filename}`
                            resolve(final_url)
                          }
                        })
                      }
                    } else {
                      console.log(`Error while writing video file.`)
                      resolve('')
                    }
                  } else {
                    console.log(`Error while downloading video file.`)
                    resolve('')
                  }
                } else {
                  resolve(`${protocol}${config.domain}/vids/${filename}`)
                }
              }
            } else {
              /* Is image. */
              let path, youtubeThumbUrl, filename
              if(isYouTubeThumbnail) {
                filename = `${file_prefix}${temp_url.pathname.split('/').slice(-2)[0]}_hqdefault.jpg`
              } else {
                let width = ''
                if(temp_url.searchParams.get('width')) {
                  width = temp_url.searchParams.get('width')
                }
                filename = `${file_prefix}w:${temp_url.searchParams.get('width')}_${temp_url.pathname.split('/').slice(-1)}`
              }
              path = `${__dirname}/../dist/pics/${filename}`
              if(!fs.existsSync(path)) {
                const download = await downloadFile(cleanUrl(url))
                if(download.success === true) {
                  const write = await writeToDisk(download.data, path)
                  if(write.success === true) {
                    let final_url = `${protocol}${config.domain}/pics/${filename}`
                    resolve(final_url)
                  } else {
                    console.log(`Error while writing image file.`, write)
                    resolve('')
                  }
                } else {
                  console.log(`Error while downloading image file.`)
                  resolve('')
                }
              } else {
                resolve(`${protocol}${config.domain}/pics/${filename}`)
              }
            }
          } else {
            console.log(`Invalid URL for downloading media: ${temp_url.hostname}.`)
            resolve('')
          }
        })()
      } else {
        resolve('self')
      }
    })
  }
}
