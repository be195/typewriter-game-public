export default class GameplayStage extends window.DefaultStage {
  async init () {
    this.ctx.globalAlpha = 1
    this.ctx.lineWidth = 1
    this.canvas.style.cursor = 'default'

    window.DefaultEnt = (await import('./ent.js')).default
    this.Player = (await import('./player.js')).default

    this.Game.Loader.addMultiple({
      enemynotice: 'Spritesheet',
      enemynoticeflip: 'Spritesheet'
    })

    // Depends on browser.
    this.spaceSymbol = typeof InstallTrigger !== 'undefined' ? '_' : '⎵'

    this.Typewriter = (await import('./typewritingHelper.js')).default
    this.enemyEnts = {
      classic: (await import('./enemies/classic.js')).default,
      lightning: (await import('./enemies/lightning.js')).default,
      lightningcloud: (await import('./enemies/lightningcloud.js')).default
    }
    this.helperEnts = await import('./helperents.js')

    await this.loadLevel('0')
  }

  async loadLevel (file) {
    window.DefaultLevel = window.DefaultLevel || (await import('./levels/default.js')).default

    const Level = (await import('./levels/' + file + '.js')).default
    this.level = new Level(this)
  }

  render () {
    const { width, height } = this.Game
    this.ctx.fillStyle = '#fff'
    this.ctx.fillRect(0, 0, width, height)
    this.ctx.save()
    if (this.shake) {
      const shakingFactor = Math.max(1 - (Date.now() - this.shake) / 1000, 0) * 4
      this.ctx.translate(
        (Math.random() - 0.5) * 2 * shakingFactor,
        (Math.random() - 0.5) * 2 * shakingFactor
      )
    }
    if (this.level) { this.level.render() }
    this.ctx.restore()
  }

  boxCollision (x1, y1, w1, h1, x2, y2, w2, h2) {
    return (
      Math.abs(x1 + w1 / 2 - (x2 + w2 / 2)) * 2 <= w1 + w2 &&
      Math.abs(y1 + h1 / 2 - (y2 + h2 / 2)) * 2 <= h1 + h2
    )
  }

  doPolygonsIntersect (a, b) {
    var polygons = [a, b];
    var minA, maxA, projected, i, i1, j, minB, maxB;

    for (i = 0; i < polygons.length; i++) {
      var polygon = polygons[i];
      for (i1 = 0; i1 < polygon.length; i1++) {
        var i2 = (i1 + 1) % polygon.length;
        var p1 = polygon[i1];
        var p2 = polygon[i2];

        var normal = { x: p2.y - p1.y, y: p1.x - p2.x };

        minA = maxA = undefined;

        for (j = 0; j < a.length; j++) {
          projected = normal.x * a[j].x + normal.y * a[j].y;
          if (typeof minA === 'undefined' || projected < minA)
            minA = projected;

          if (typeof maxA === 'undefined' || projected > maxA)
            maxA = projected;

        }

        minB = maxB = undefined;
        for (j = 0; j < b.length; j++) {
            projected = normal.x * b[j].x + normal.y * b[j].y;
            if (typeof minB === 'undefined' || projected < minB)
              minB = projected;

            if (typeof maxB === 'undefined' || projected > maxB)
              maxB = projected;
        }

        if (maxA < minB || maxB < minA)
          return false;
      }
    }
    return true;
  }

  lerp (a, b, t) {
    t = Math.min(Math.max(t, 0), 1)
    return b * t + a * (1 - t)
  }

  update (dt) {
    if (this.level) { this.level.update(dt) }
  }

  handleKeyEvent (e) {
    if (this.level) { this.level.handleKeyEvent(e) }
  }

  roundRect (x, y, width, height, radius = 4, fill = false, stroke = true) {
    const { ctx } = this
    if (typeof radius === 'number') { radius = { tl: radius, tr: radius, br: radius, bl: radius } } else {
      const defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 }
      for (const side in defaultRadius) {
        radius[side] = radius[side] || defaultRadius[side]
      }
    }
    ctx.beginPath()
    ctx.moveTo(x + radius.tl, y)
    ctx.lineTo(x + width - radius.tr, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr)
    ctx.lineTo(x + width, y + height - radius.br)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height)
    ctx.lineTo(x + radius.bl, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl)
    ctx.lineTo(x, y + radius.tl)
    ctx.quadraticCurveTo(x, y, x + radius.tl, y)
    ctx.closePath()
    if (fill) { ctx.fill() }
    if (stroke) { ctx.stroke() }
  }

  textBubble (x, y, left, written) {
    const {
      ctx,
      Game
    } = this
    const {
      width,
      height
    } = Game

    const fontSize = 24
    ctx.font = fontSize + 'px "Roboto Mono", monospace, "Times New Roman"'
    const text = ctx.measureText(written + left)

    const padding = 8
    x -= text.width / 2, y -= fontSize

    const bw = text.width + padding * 2
    const bh = fontSize + padding * 2
    x = Math.max(0, Math.min(x, width - bw))
    y = Math.max(0, Math.min(y, height - bh))

    const {
      brand,
      brandComplementary
    } = Game.colors
    ctx.strokeStyle = brandComplementary
    ctx.fillStyle = 'white'
    this.roundRect(
      x - padding,
      y - padding,
      text.width + padding * 2,
      fontSize + padding * 2,
      4,
      true
    )

    const writtenText = ctx.measureText(written)

    ctx.textAlign = 'left'
    ctx.fillStyle = brand
    ctx.fillText(written.replaceAll(' ', this.spaceSymbol), x, y)
    ctx.fillStyle = brandComplementary
    ctx.fillText(left.replaceAll(' ', this.spaceSymbol), x + writtenText.width, y)

    return { modPos: [x, y], writtenText }
  }
}
