export class Audio {
  constructor (game, file) {
    this.Game = game

    this.audioCtx = game.audioCtx
    this.init(file)
  }

  async init (file) {
    if (this.audioBuffer) { return this.audioBuffer }
    const response = await fetch(`assets/audio/${file}.ogg`)
    const arrayBuffer = await response.arrayBuffer()
    this.audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer)
  }

  play (pitch = 1, loop = false) {
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume()
    const trackSrc = this.audioCtx.createBufferSource()
    trackSrc.buffer = this.audioBuffer
    trackSrc.playbackRate.value = pitch
    trackSrc.loop = loop
    trackSrc.connect(this.audioCtx.destination)

    trackSrc.start()
    return trackSrc
  }
}
