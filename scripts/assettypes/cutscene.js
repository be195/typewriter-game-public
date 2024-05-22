export class Cutscene extends EventTarget {
  constructor (game, file) {
    super()
    this.Game = game

    this.video = document.createElement('video')
    this.video.className = 'video'
    this.video.src = `assets/videos/${file}.mp4`
    this.video.controls = false
    this.video.muted = true
    this.skipButton = document.createElement('img')
    this.skipButton.className = 'videoButton videoSkipButton'
    this.skipButton.src = 'assets/images/skip.gif'
    this.muteButton = document.createElement('img')
    this.muteButton.className = 'videoButton videoMuteButton'
    this.muteButton.src = 'assets/images/muted.gif'
    this.controlOverlay = document.createElement('div')
    this.controlOverlay.className = 'controlOverlay'
    this.videoContainer = document.createElement('div')
    this.videoContainer.className = 'videoContainer'
    this.videoContainer.appendChild(this.video)
    this.videoContainer.appendChild(this.muteButton)
    this.videoContainer.appendChild(this.controlOverlay)
    this.videoContainer.appendChild(this.skipButton)

    this.video.addEventListener('pause', () => this.handleStop())
    this.skipButton.addEventListener('click', () => this.handleStop())
    this.controlOverlay.addEventListener('click', () => this.handleMute())
  }

  handleStop () {
    try {
      this.Game.overlay.removeChild(this.videoContainer)
    } catch (err) {}
    this.dispatchEvent(new Event('stop'))
  }

  handleMute () {
    this.video.muted = !this.video.muted
    this.muteButton.src = `assets/images/${this.video.muted ? 'muted' : 'sound'}.gif`
  }

  start () {
    this.Game.overlay.appendChild(this.videoContainer)
    this.video.play()
  }
}
