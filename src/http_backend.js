function $HttpBackendProvider () {
  this.$get = function () {
    return (method, url, post, callback) => {
      let xhr = new window.XMLHttpRequest()
      xhr.open(method, url, true)
      xhr.send(post || null)
      xhr.onload = () => {
        let response = ('response' in xhr) ? xhr.response : xhr.responseText
        let statusText = xhr.statusText || ''
        callback(xhr.status, response, statusText)
      }
      xhr.onerror = () => {
        callback(-1, null, '')
      }
    }
  }
}
export { $HttpBackendProvider }
