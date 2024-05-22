// part of LightningCloudEnemy
export default class LightningEnemy extends window.DefaultEnt {
  constructor (stage, level, x, y, params) {
    super(stage, level, x, y, params)

    this.initialPos = [ x, y ]
    this.params.speed = this.params.speed || 1

    const { alphabet } = this.level.game.lang
    this.typeWriter = new this.stage.Typewriter(alphabet[Math.floor(Math.random() * alphabet.length)])
    this.typeWriter.addEventListener('write', ({ detail }) => {
      this.hits++
      this.hit = Date.now()
      this.writtenCharacters.push([detail.keyPressed, Date.now(), Math.random()])
    })
    this.typeWriter.addEventListener('done', ({ detail }) => {
      const { accuracy, cpm, deltaTime } = detail
      if (accuracy !== Infinity && cpm !== Infinity) {
        this.stage.Game.accuracyCollection.push(accuracy * 100),
        this.stage.Game.cpmCollection.push(cpm)
      }

      const addScore = Math.floor(Math.max(15 * this.typeWriter.written.length - deltaTime, 25) * accuracy)
      console.log('Adding score:', addScore)
      this.stage.Game.setScore(addScore)

      this.destroy()
    })
    this.typeWriter.addEventListener('err', () =>
      this.stage.shake = Date.now()
    )

    this.movingDuration = 2000
    this.deathAnimDuration = 100

    this.stage.Game.Loader.add('lightning', 'Spritesheet')

    this.level.enemies.unshift(this)
  }

  update () {
    const { lightning, playerstareblink } = this.level.game.Loader.loaded
    if (!lightning.meta || !playerstareblink.meta) return
    if (this.death) {
      return Date.now() - this.death >= this.deathAnimDuration &&
        (this.level.enemies.splice(this.level.enemies.indexOf(this), 1))
    }

    const [ lw, lh ] = lightning.meta.resolution
    const [ pw, ph ] = playerstareblink.meta.resolution

    const { player } = this.level
    const px = player.pos[0] + pw / 2,
      py = player.pos[1] + ph / 2

    const angle = Math.atan2(
      this.pos[0] - px,
      py - this.pos[1]
    )
    const polygon1 = this.rect2Polygon(this.pos[0] + lw / 2, this.pos[1] + lh / 2, lw, lh, angle);
    const polygon2 = this.rect2Polygon(px, py, pw, ph, 0);
    if (this.stage.doPolygonsIntersect(polygon1, polygon2)) {
      this.destroy()
      return player.lowerHealth()
    }

    let deltaTime = Math.max(Math.min((Date.now() - this.createdAt) * this.params.speed / this.movingDuration - 0.3, 1), 0)
    deltaTime = 1 - Math.pow(1 - deltaTime, 3)
    this.pos = [
      this.stage.lerp(this.initialPos[0], px, deltaTime),
      this.stage.lerp(this.initialPos[1], py, deltaTime)
    ]
  }

  render () {
    const { lightning, playerstareblink } = this.level.game.Loader.loaded
    if (!lightning.meta || !playerstareblink.meta) return

    const { ctx } = this.stage

    const { player } = this.level
    const px = player.pos[0] + playerstareblink.meta.resolution[0] / 2,
      py = player.pos[1] + playerstareblink.meta.resolution[1] / 2
    const angle = Math.atan2(
      this.pos[0] - px,
      py - this.pos[1]
    )

    const [ sw, sh ] = lightning.meta.resolution
    ctx.save()
    ctx.globalAlpha = this.death ? Math.max(1 - (Date.now() - this.death) / this.deathAnimDuration, 0) : 1
    ctx.translate(this.pos[0] + sw / 2, this.pos[1] + sh / 2)
    ctx.rotate(angle)
    lightning.drawSprite(
      ctx,
      -sw / 2,
      -sh / 2
    )
    ctx.restore()
  }

  rect2Polygon(x, y, w, h, angle) {
    const sin = Math.sin(angle),
      cos = Math.cos(angle)

    const hw = w / 2, hh = h / 2
    const r1x = -hw * cos - hh * sin
    const r1y = -hw * sin + hh * cos
    const r2x =  hw * cos - hh * sin
    const r2y =  hw * sin + hh * cos

    return [
      { x: x + r1x, y: y + r1y },
      { x: x + r2x, y: y + r2y },
      { x: x - r1x, y: y - r1y },
      { x: x - r2x, y: y - r2y }
    ]
  }
}