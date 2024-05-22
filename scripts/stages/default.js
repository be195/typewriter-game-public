export class DefaultStage {
  constructor (game) {
    this.Game = game
    this.canvas = game.canvasElem
    this.ctx = game.canvasCtx
  }

  render () {
    this.Game.drawError()
  }

  update (t) {}
  init () {}
  handleMouseEvent (e) {}
  handleKeyEvent (e) {}
}
