import { defaults } from './http'

function $HttpBackendProvider () {
  this.$get = function () {
    return (method, url, post, callback, headers) => {
      const allHeader = _.extend({}, defaults.headers.common, defaults.headers[method.toLowerCase()], headers)
      const xhr = new window.XMLHttpRequest()
      xhr.open(method, url, true)
      _.forEach(allHeader, function (v, k) {
        if (post || k.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(k, v)
        }
      })
      xhr.send(post || null)
      xhr.onload = () => {
        const response = ('response' in xhr) ? xhr.response : xhr.responseText
        const statusText = xhr.statusText || ''
        callback(xhr.status, response, xhr.getAllResponseHeaders(), statusText)
      }
      xhr.onerror = () => {
        callback(-1, null, '')
      }
    }
  }
}
export { $HttpBackendProvider }
