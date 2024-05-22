export default class NullStage extends window.DefaultStage {
  init () {
    this.Game.loadAssets()
    this.canvas.style.cursor = 'pointer'
  }

  render (time) {
    if (!this.Game.assetLoaderReady) return
    this.Game.Loader.add('ss', 'Image')
    const { ctx } = this
    const { ss, playButton } = this.Game.Loader.loaded
    const { width, height } = this.Game

    if (this.clicked) ctx.globalAlpha = 1 - (Date.now() - this.clicked) / 250

    ctx.imageSmoothingEnabled = false

    if (ss) {
      ctx.drawImage(
        ss,
        0,
        0,
        ss.width,
        ss.height
      )
    }

    const fontSize = 64 + Math.sin(Date.now() / 500) * 8
    ctx.font = fontSize + 'px "Roboto Mono", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = 'white'
    ctx.strokeStyle = this.Game.colors.brand
    ctx.lineWidth = 4
    ctx.fillText('▶', width / 2, height / 2)
    ctx.strokeText('▶', width / 2, height / 2)
  }

  handleMouseEvent (e) {
    if (this.Game.assetLoaderReady && e.type === 'click' && !this.clicked) { this.clicked = Date.now() }
  }

  update () {
    if (this.clicked && Date.now() - this.clicked > 250) { this.Game.switchStage('IntroStage') }
  }
}
