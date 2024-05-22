/*
  CONCEPT:

  the behavior can be separated into 2 stages:
    1. coming up close to the player; when the enemy/the player is hurt move
      back into the initial position and switch stages
    2. move in an ellipse around the player and shoot at the player with
      lightning enemy entities; stop at X seconds and switch stages
  the behavior pattern (1212121212...) stops when the player dies or the enemy
  doesn't have health.

  (1st stage needs to have a typewriter helper object, it should be obvious)

  idea: behave faster if the enemy is about to die (health <= half max health).
*/
export default class LightningCloudEnemy extends window.DefaultEnt {
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

    this.COMING_UP_CLOSE = 1
    this.FLYING_AROUND = 2
    this.currentState = this.FLYING_AROUND
    this.switchStates()

    this.health = 3

    this.shootAt = 0
    this.shootDelay = 400
    this.shootFairDistance = 720

    this.hitDuration = 500
    this.hits = 0

    this.createdAtDuration = 500
    this.deathAnimDuration = 1000
    this.movingBackDuration = 1000

    this.stage.Game.Loader.addMultiple({
      enemyclassic: 'Spritesheet',
      enemyclassicdeath: 'Spritesheet',
      enemyclassichit: 'Image',

      enemyclassicflip: 'Spritesheet',
      enemyclassicflipdeath: 'Spritesheet',
      enemyclassicfliphit: 'Image'
    })

    this.level.enemies.push(this)
  }

  async switchStates() {
    switch (this.currentState) {
      case this.COMING_UP_CLOSE:
        this.typeWriterFinish = Date.now()
        this.movingBack = Date.now()
        this.hitPos = this.pos
        await this.level.timeout(this.movingBackDuration)()

        this.typeWriter = null
        this.flyingAroundStageDone = null

        const { player } = this.level
        const {
          enemyclassic,
          playerstareblink
        } = this.stage.Game.Loader.loaded
        this.radiuses = [
          Math.abs(
            (player.pos[0] + playerstareblink.meta.resolution[0] / 2) -
              this.pos[0]
          ),
          Math.abs(
            (player.pos[1] + playerstareblink.meta.resolution[1] / 2) -
              (this.pos[1] - enemyclassic.meta.resolution[1])
          )
        ]
        break
      case this.FLYING_AROUND:
        await this.level.timeout(this.movingBackDuration)()
        this.typeWriterFinish = null
        this.typeWriter = new this.stage.Typewriter(this.params.word[Math.floor(Math.random() * this.params.word.length)])
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

          this.lowerHealth()
        })
        this.typeWriter.addEventListener('err', () =>
          this.stage.shake = Date.now()
        )
        this.eventTarget.dispatchEvent(new Event('typeWriterCreated'))
        break
    }

    this.currentState++

    if (this.currentState > this.FLYING_AROUND)
      this.currentState = this.COMING_UP_CLOSE

    this.lastSwitch = Date.now()
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
    if (((this.hit && Date.now() - this.hit < this.hitDuration) && !this.typeWriterFinish) || this.noMove) return

    const [ pw, ph ] = playerstareblink.meta.resolution
    const [ ew, eh ] = enemyclassic.meta.resolution
    switch (this.currentState) {
      case this.COMING_UP_CLOSE:
        const hasCollision = this.stage.boxCollision(
          this.pos[0], this.pos[1],
          ew, eh,
          player.pos[0], player.pos[1],
          pw, ph
        )

        const sideFactor = (player.pos[0] + pw / 4) - this.pos[0] < 0 ? -1 : 1
        const mBDeltaT = Date.now() - this.movingBack
        if (mBDeltaT < this.movingBackDuration) {
          this.pos[0] = this.stage.lerp(
            this.hitPos[0],
            this.initialPos[0],
            mBDeltaT / this.movingBackDuration
          )
          this.pos[1] = this.stage.lerp(
            this.hitPos[1],
            this.initialPos[1],
            mBDeltaT / this.movingBackDuration
          )
        } else if (!hasCollision) {
          this.pos[0] += this.spd * sideFactor * dt
          if (this.pos[1] < player.pos[1]) { this.pos[1] += this.spd * dt }
          if (this.pos[1] > player.pos[1] + ph) { this.pos[1] -= this.spd * dt }
        } else {
          player.lowerHealth()
          this.hitPos = this.pos
          this.movingBack = Date.now()
        }
        break
      case this.FLYING_AROUND:
        const time = Date.now() - this.lastSwitch

        const [ rx, ry ] = this.radiuses
        const angle = time / 45 - 90
        const t = Math.tan(angle / 360 * Math.PI)
        const px = rx * (1 - t ** 2) / (1 + t ** 2),
          py = ry * 2 * t / (1 + t ** 2);

        if (angle >= 270 && !this.flyingAroundStageDone) {
          this.flyingAroundStageDone = Date.now()
          this.switchStates()
        }

        let deltaTime = this.flyingAroundStageDone ?
          this.movingBackDuration - (Date.now() - this.flyingAroundStageDone) :
          time
        deltaTime = Math.max(Math.min(deltaTime / this.movingBackDuration, 1), 0)
        deltaTime = 1 - Math.pow(1 - deltaTime, 2)
        this.pos = [
          this.stage.lerp(this.initialPos[0], player.pos[0] + pw / 2 + px - ew / 2, deltaTime),
          this.stage.lerp(this.initialPos[1], player.pos[1] + ph / 2 + py - eh / 2, deltaTime)
        ]

        const distance = Math.sqrt(
          ((player.pos[0] + pw / 2) - (this.pos[0] + ew / 2)) ** 2 +
            ((player.pos[1] + ph / 2) - (this.pos[1] + eh / 2)) ** 2
        )
        if (Date.now() - this.shootAt >= this.shootDelay && distance >= this.shootFairDistance * 0.42 && deltaTime === 1) {
          const enemy = this.level.spawnEnemyAsyncless('lightning', [ this.pos[0] + ew / 2, this.pos[1] + eh / 2 ], 'a')
          enemy.params.speed = distance / this.shootFairDistance
          this.shootAt = Date.now()
        }

        break
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

  renderOverlay() {
    if (!this.typeWriter) return
    const { ctx } = this.stage

    ctx.save()
    ctx.globalAlpha = this.typeWriterFinish
      ? this.stage.lerp(1, 0, (Date.now() - this.typeWriterFinish) / this.deathAnimDuration)
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

  lowerHealth() {
    this.health--

    if (this.health <= 0)
      this.destroy()
    else
      this.switchStates()
  }

  destroy () {
    this.death = this.deathSpriteOptions.lastCheck = Date.now()
  }
}
