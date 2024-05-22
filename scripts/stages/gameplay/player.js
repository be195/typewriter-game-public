export default class Player extends window.DefaultEnt {
  constructor (stage, level, x, y) {
    super(stage, level, x, y)

    this.stage.Game.Loader.addMultiple({
      playerstareblink: 'Spritesheet',
      playerattack: 'Spritesheet',
      playerhurt: 'Image',
      heart: 'Spritesheet',
      heartbroken: 'Spritesheet',
      umbrella: 'Spritesheet'
    })

    this.health = 5
    this.recoveringLimit = 1500
    this.attackLimit = 625
    this.maxHealth = 5

    this.hitFadeOutDuration = 500
  }

  lowerHealth () {
    if (this.recovering && Date.now() - this.recovering < this.recoveringLimit) return false
    if (this.shield) return this.shield = false;
    this.health--
    this.recovering = Date.now()
    this.stage.Game.Loader.loaded.playerhurt.currentX = -1,
    this.stage.Game.Loader.loaded.playerhurt.currentY = 0
    if (this.health <= 0) {
      this.death = Date.now()
      throw new Error('die')
    }
    if (Math.random() >= 0.5) { this.level.spawnHealthBalloon() }
  }

  renderShield (id) {
    const time = Date.now() - Math.PI * 2000 * id;
    const { playerstareblink, umbrella } = this.stage.Game.Loader.loaded
    const { ctx } = this.stage
    if (!umbrella.meta) return
    const [ spriteWidth, spriteHeight ] = umbrella.meta.resolution

    const halfPlayerWidth = playerstareblink.meta.resolution[0] / 2;

    const xTime = time / 1000 / 2
    const x = this.pos[0] + halfPlayerWidth - spriteWidth / 2 + Math.sin(xTime) * (halfPlayerWidth + 48)
    const y = this.pos[1] + playerstareblink.meta.resolution[1] / 3 + Math.sin(time / 1000) * 4

    const deltaTime = 1 - Math.pow(1 - Math.min((Date.now() - this.shield.appliedAt) / 1000, 1), 2)
    ctx.save()
    ctx.globalAlpha = 1 - id * (1 / this.shieldSP.length)
    const spriteX = this.stage.lerp(this.shield.x, x, deltaTime),
      spriteY = this.stage.lerp(this.shield.y, y, deltaTime)
    ctx.translate(spriteX + spriteWidth / 2, spriteY + spriteHeight / 2)
    ctx.rotate(this.stage.lerp(0, Math.sin(xTime - .3) * (Math.PI / 6), deltaTime))
    umbrella.drawSprite(
      ctx,
      -spriteWidth / 2,
      -spriteHeight / 2
    )
    ctx.restore()
    if ((xTime - 1) % Math.PI <= 0.01 && Date.now() - this.shieldSP[id].frontSwitchAt >= 100)
      this.shieldSP[id].front = !this.shieldSP[id].front,
      this.shieldSP[id].frontSwitchAt = Date.now()
  }

  render () {
    const {
      playerstareblink,
      playerhurt,
      playerattack
    } = this.stage.Game.Loader.loaded
    const { ctx } = this.stage

    if (this.shield)
      for (const shield in this.shieldSP)
        if (!this.shieldSP[shield].front)
          this.renderShield(shield)

    ctx.save()
    if (this.recovering && Date.now() - this.recovering < this.recoveringLimit) {
      ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 1000 * 16) * 0.4
      const shakingFactor = (1 - (Date.now() - this.recovering) / this.recoveringLimit) * 8
      this.stage.ctx.drawImage(
        playerhurt,
        this.pos[0] + (Math.random() - 0.5) * 2 * shakingFactor,
        this.pos[1] + (Math.random() - 0.5) * 2 * shakingFactor
      )
    } else {
      const isAttacking = Date.now() - this.enemyHitAt < this.attackLimit
      const currentAsset = isAttacking ? playerattack : playerstareblink
      let params = isAttacking ? this.attackParams : {}
      params = currentAsset.drawSprite(ctx, this.pos[0], this.pos[1], 1, true, params)
      if (isAttacking) this.attackParams = params
    }
    ctx.restore()

    if (this.shield)
      for (const shield in this.shieldSP)
        if (this.shieldSP[shield].front)
          this.renderShield(shield)
  }

  renderOverlay () {
    const { ctx, Game } = this.stage
    const {
      heart,
      heartbroken
    } = Game.Loader.loaded
    const {
      width,
      height,
      colors
    } = Game
    const scale = 0.5

    if (this.enemyHitAt && Date.now() - this.enemyHitAt < this.hitFadeOutDuration) {
      ctx.save()
      ctx.globalAlpha = this.stage.lerp(1, 0, (Date.now() - this.enemyHitAt) / this.hitFadeOutDuration)

      const fontSize = 32
      ctx.font = fontSize + 'px "Roboto Mono"'
      ctx.textAlign = 'center'
      const text = ctx.measureText(this.hitText)
      ctx.fillStyle = 'white'
      ctx.strokeStyle = 'rgba(0, 0, 0, .24)'

      const padding = 8
      const textY = height - fontSize - 16
      this.stage.roundRect(
        width / 2 - text.width / 2 - padding,
        textY - padding,
        text.width + padding * 2,
        fontSize + padding * 2,
        8,
        true,
        true
      )

      ctx.fillStyle = colors.brand
      ctx.fillText(this.hitText, width / 2, textY)

      ctx.restore()
    } else { this.hitText = '' }

    for (let i = 0; i < this.maxHealth; i++) {
      const currentAsset = i < this.health ? heart : heartbroken
      if (!currentAsset.meta) continue

      const {
        resolution
      } = currentAsset.meta
      currentAsset.drawSprite(this.stage.ctx, resolution[0] * i * scale, height - resolution[1] * scale, scale)
    }

    ctx.font = '32px "Roboto Mono"'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillStyle = this.level.game.colors.brand
    const score = this.stage.lerp(
      this.level.game.previousScore,
      this.level.game.score,
      (Date.now() - this.level.game.latestScore) / 500
    )
    const margin = 8
    ctx.fillText(Math.floor(score), width - margin, height - margin)
  }

  onHit (key) {
    if (Date.now() - this.enemyHitAt >= this.attackLimit || !this.enemyHitAt)
      this.attackParams = { currentX: -1, currentY: 0, stopBeforeLoop: true }
    this.enemyHitAt = Date.now()
    this.hitText += key
  }
}
