export default class ClassicEnemy extends window.DefaultEnt {
  constructor (stage, level, x, y, params) {
    super(stage, level, x, y, params)

    this.initialPos = [ x, y ]
    this.hitPos = [0, 0]
    this.movingBack = 0
    this.spd = (this.params.spd || 1) * (60 / 1000)
    this.deathSpriteOptions = {
      currentX: 0,
      currentY: 0,
      lastCheck: Date.now()
    }
    this.noticeSpriteOptions = {
      currentX: 0,
      currentY: 0,
      lastCheck: Date.now(),
      noLoop: true
    }
    this.eventTarget = new EventTarget()

    this.createdAtDuration = 500
    this.deathAnimDuration = 1000
    this.hitDuration = 500
    this.hits = 0

    this.stage.Game.Loader.addMultiple({
      enemyclassic: 'Spritesheet',
      enemyclassicdeath: 'Spritesheet',
      enemyclassichit: 'Image',

      enemyclassicflip: 'Spritesheet',
      enemyclassicflipdeath: 'Spritesheet',
      enemyclassicfliphit: 'Image'
    })

    this.typeWriter = new this.stage.Typewriter(this.params.word)
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

      const addScore = Math.floor(Math.max(150 * this.typeWriter.written.length - deltaTime, 250) * accuracy)
      console.log('Adding score:', addScore)
      this.stage.Game.setScore(addScore)

      this.destroy()
    })
    this.typeWriter.addEventListener('err', () =>
      this.stage.shake = Date.now()
    )

    this.level.enemies.push(this)
  }

  update (dt) {
    const {
      enemyclassic,
      playerstareblink
    } = this.stage.Game.Loader.loaded
    if (!playerstareblink.meta || !enemyclassic.meta) return

    if (this.level.player.death) return

    if (this.death) {
      return Date.now() - this.death >= this.deathAnimDuration &&
        (
          this.eventTarget.dispatchEvent(new Event('death')),
          this.level.enemies.splice(this.level.enemies.indexOf(this), 1)
        )
    }

    this.offsetY = Math.sin(Date.now() / 500) * 12

    const {
      player
    } = this.level
    if ((this.hit && Date.now() - this.hit < this.hitDuration) || this.noMove) return

    const hasCollision = this.stage.boxCollision(
      this.pos[0], this.pos[1],
      enemyclassic.meta.resolution[0], enemyclassic.meta.resolution[1],
      player.pos[0], player.pos[1],
      playerstareblink.meta.resolution[0], playerstareblink.meta.resolution[1]
    )

    const sideFactor = (player.pos[0] + playerstareblink.meta.resolution[0] / 4) - this.pos[0] < 0 ? -1 : 1
    const mBDeltaT = Date.now() - this.movingBack
    if (mBDeltaT < 1000) {
      this.pos[0] = this.stage.lerp(
        this.hitPos[0],
        this.initialPos[0],
        mBDeltaT / 1000
      )
      this.pos[1] = this.stage.lerp(
        this.hitPos[1],
        this.initialPos[1],
        mBDeltaT / 1000
      )
    } else if (!hasCollision) {
      this.pos[0] += this.spd * sideFactor * dt
      if (this.pos[1] < player.pos[1]) { this.pos[1] += this.spd * dt }
      if (this.pos[1] > player.pos[1] + playerstareblink.meta.resolution[1]) { this.pos[1] -= this.spd * dt }
    } else {
      player.lowerHealth()
      this.hitPos = this.pos
      this.movingBack = Date.now()
    }
  }

  render () {
    if (!this.level.player) return
    const {
      enemynotice,
      enemynoticeflip,

      enemyclassic,
      enemyclassichit,
      enemyclassicdeath,

      enemyclassicflip,
      enemyclassicfliphit,
      enemyclassicflipdeath,

      playerstareblink
    } = this.stage.Game.Loader.loaded
    if (!playerstareblink.meta) return
    const sideFactor = (this.level.player.pos[0] + playerstareblink.meta.resolution[0] / 4) - this.pos[0] < 0

    this.stage.ctx.save()
    this.stage.ctx.globalAlpha = this.stage.lerp(0, 1, (Date.now() - this.createdAt) / this.createdAtDuration)

    if ((this.hit && Date.now() - this.hit < this.hitDuration) && !this.death) {
      const shakingFactor = (this.hitDuration - (Date.now() - this.hit)) / this.hitDuration * (Math.min(this.hits, 4) * 4)
      this.stage.ctx.drawImage(
        (sideFactor ? enemyclassicfliphit : enemyclassichit),
        this.pos[0] + (Math.random() - 0.5) * 2 * shakingFactor,
        this.pos[1] + this.offsetY + (Math.random() - 0.5) * 2 * shakingFactor
      )
      if (enemynotice.meta && enemyclassic.meta) {
        this.noticeSpriteOptions = (sideFactor ? enemynoticeflip : enemynotice).drawSprite(
          this.stage.ctx,
          this.pos[0] - (sideFactor ? enemynotice.meta.resolution[0] : -enemyclassic.meta.resolution[0]),
          this.pos[1],
          1,
          true,
          this.noticeSpriteOptions
        )
      }
    } else {
      this.hits = 0
      this.noticeSpriteOptions = {
        currentX: 0,
        currentY: 0,
        lastCheck: Date.now(),
        noLoop: true
      }

      const sprite = sideFactor
        ? (this.death ? enemyclassicflipdeath : enemyclassicflip)
        : (this.death ? enemyclassicdeath : enemyclassic)
      const result = sprite.drawSprite(
        this.stage.ctx,
        this.pos[0],
        this.pos[1] + this.offsetY,
        1,
        true,
        this.death ? this.deathSpriteOptions : {}
      )
      if (this.death) this.deathSpriteOptions = result
    }

    this.stage.ctx.restore()
  }

  destroy () {
    this.death = this.deathSpriteOptions.lastCheck = Date.now()
  }
}
