export default class Typewriter extends EventTarget {
  constructor (word) {
    super()
    this.left = word
    this.written = ''
    this.lowercaseRegex = /([a-z])/g
    this.errorAmt = 0
  }

  canBeProcessed (e) {
    return this.left !== '' && this.left.startsWith(e.key)
  }

  handleKeyEvent (e) {
    if (e.type !== 'keydown') return
    if (this.left === '') return

    const key = e.key.toLowerCase()
    if (!(key.length === 1 && (key.search(this.lowercaseRegex) !== -1 || key === ' '))) return
    if (!this.startTime) { this.startTime = Date.now() }

    if (this.left.startsWith(key)) {
      this.left = this.left.slice(1),
      this.written += key

      this.dispatchEvent(new CustomEvent('write', {
        detail: {
          left: this.left,
          written: this.written,
          keyPressed: key
        }
      }))

      if (this.left === '') {
        this.dispatchEvent(new CustomEvent('done', {
          detail: {
            accuracy: this.written.length / (this.written.length + this.errorAmt),
            cpm: this.written.length / ((Date.now() - this.startTime) / 60000),
            deltaTime: Date.now() - this.startTime
          }
        }))
      }
    } else {
      this.errorAmt++
      console.log('Keyboard error:', key)
      this.dispatchEvent(new Event('err'))
    }

    return true
  }
};
