export default class Entity {
  constructor (stage, level, x, y, params = {}) {
    this.stage = stage
    this.level = level
    this.pos = [x, y]
    this.params = params

    this.createdAt = Date.now()
    this.death = false

    this.createdAtDuration = 100
    this.deathAnimDuration = 100

    this.typeWriter = false
    this.writtenCharacters = []
    this.writtenCharactersPos = []
  }

  renderOverlay () {
    if (!this.typeWriter) return
    const { ctx } = this.stage

    ctx.save()
    ctx.globalAlpha = this.death
      ? this.stage.lerp(1, 0, (Date.now() - this.death) / this.deathAnimDuration)
      : this.stage.lerp(0, 1, (Date.now() - this.createdAt) / this.createdAtDuration)
    const { left, written } = this.typeWriter
    const { modPos, writtenText } = this.stage.textBubble(this.pos[0], this.pos[1], left, written)

    ctx.fillStyle = this.stage.Game.colors.brandComplementary
    ctx.textAlign = 'center'
    for (const index in this.writtenCharacters) {
      if (!this.writtenCharactersPos[index]) { this.writtenCharactersPos[index] = [modPos[0] + writtenText.width, modPos[1]] }
      const [cx, cy] = this.writtenCharactersPos[index]
      const [character, t, rand] = this.writtenCharacters[index]
      const time = (Date.now() - t) / 1000
      const angle = this.stage.lerp(0, 180 * rand, time)
      const alpha = 1 - time

      ctx.save()
      ctx.translate(cx, cy - time * 64)
      ctx.rotate(angle * Math.PI / 180)
      ctx.globalAlpha = Math.max(alpha, 0)
      ctx.fillText(character, 0, 0)
      ctx.restore()

      if (time >= 1) {
        this.writtenCharacters.splice(index, 1),
        this.writtenCharactersPos.splice(index, 1)
      }
    }

    ctx.restore()
  }

  handleKeyEvent (e) {
    return this.typeWriter && this.typeWriter.handleKeyEvent(e)
  }

  destroy () {
    this.death = Date.now()
  }

  render () {}
  update () {}
  handleMouseEvent () {}
}
