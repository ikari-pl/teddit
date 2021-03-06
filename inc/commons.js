module.exports = function(request, fs) { 
  this.downloadFile = (url) => {
    return new Promise(resolve => {
      request(url, { encoding: 'binary' }, (error, response, body) => {
        if(!error && response.statusCode === 200) {
          resolve({ success: true, data: body })
        } else {
          resolve({ success: false, data: null })
        }
      })
    })
  }

  this.writeToDisk = (data, filename) => {
    return new Promise(resolve => {
      fs.writeFile(filename, data, 'binary', (error, result) => {
        if(!error) {
          resolve({ success: true })
        } else {
          resolve({ success: false })
        }
      })
    })
  }

  this.logTimestamp = (date) => {
    return date.toGMTString()
  }

  this.cleanUrl = (url) => {
    return url.replace(/&amp;/g, '&')
  }

  this.localizeUrl = (url, dir) => {
    url = cleanUrl(url)
    let temp_url = new URL(url)
    if(!dir)
      dir = ''
    return url.replace(temp_url.origin, `${protocol}${domain}${dir}`)
  }

  this.kFormatter = (num) => {
      return Math.abs(num) > 999 ? Math.sign(num)*((Math.abs(num)/1000).toFixed(1)) + 'k' : Math.sign(num)*Math.abs(num)
  }
    
  this.timeDifference = (time) => {
    time = parseInt(time) * 1000
    let ms_per_minute = 60 * 1000
    let ms_per_hour = ms_per_minute * 60
    let ms_per_day = ms_per_hour * 24
    let ms_per_month = ms_per_day * 30
    let ms_per_year = ms_per_day * 365
    let current = + new Date()

    let elapsed = Math.abs(time - current)
    let r = ''
    let e

    if(elapsed < ms_per_minute) {
      e = Math.round(elapsed/1000)
      r = `${e} seconds ago`
      if(e === 1)
        r = 'just now'
      return r
    }

    else if(elapsed < ms_per_hour) {
      e = Math.round(elapsed/ms_per_minute)
      r = `${e} minutes ago`
      if(r === 1)
        r = 'a minute ago'
      return r
    }

    else if(elapsed < ms_per_day ) {
      e = Math.round(elapsed/ms_per_hour)
      r = `${e} hours ago`
      if(e === 1)
        r = 'an hour ago'
      return r
    }

    else if(elapsed < ms_per_month) {
      e = Math.round(elapsed/ms_per_day)
      r = `${e} days ago`
      if(e === 1)
        r = '1 day ago'
      return r
    }

    else if(elapsed < ms_per_year) {
      e = Math.round(elapsed/ms_per_month)
      r = `${e} months ago`
      if(e === 1)
        r = '1 month ago'
      return r
    }

    else {
      e = Math.round(elapsed/ms_per_year)
      r = `${e} years ago`
      if(e === 1)
        r = '1 year ago'
      return r
    }
  }
  
  this.toUTCString = (time) => {
    let d = new Date();
    d.setTime(time*1000);
    return d.toUTCString();
  }

  this.unescape = (s) => {
    if(s) {
      var re = /&(?:amp|#38|lt|#60|gt|#62|apos|#39|quot|#34);/g;
      var unescaped = {
        '&amp;': '&',
        '&#38;': '&',
        '&lt;': '<',
        '&#60;': '<',
        '&gt;': '>',
        '&#62;': '>',
        '&apos;': "'",
        '&#39;': "'",
        '&quot;': '"',
        '&#34;': '"'
      }
      return s.replace(re, (m) => {
        return unescaped[m]
      })
    } else {
      return ''
    }
  }

  this.deleteFiles = (files, callback) => {
    var i = files.length
    files.forEach((filepath) => {
      fs.unlink(filepath, (err) => {
        i--
        if(err) {
          callback(err)
          return
        } else if(i <= 0) {
          callback(null)
        }
      })
    })
  }
  
  this.isGif = (url) => {
    try {
      url = new URL(url)
      let pathname = url.pathname
      let file_ext = pathname.substring(pathname.lastIndexOf('.') + 1)
      if(file_ext === 'gif' || file_ext === 'gifv') {
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error(`Invalid url supplied to isGif(). URL: ${url}`, error)
      return false
    }
  }

  this.getFileExtension = (url) => {
    try {
      url = new URL(url)
      let pathname = url.pathname
      let file_ext = pathname.substring(pathname.lastIndexOf('.') + 1)
      if(file_ext) {
        return file_ext
      } else {
        return ''
      }
    } catch (error) {
      console.error(`Invalid url supplied to getFileExtension(). URL: ${url}`, error)
      return ''
    }
  }
}
