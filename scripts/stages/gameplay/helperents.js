export class HealthBalloon extends window.DefaultEnt {
  constructor (stage, level, x, y, params) {
    super(stage, level, x, y, params)

    this.spd = (this.params.spd || 4) * (60 / 1000)

    this.stage.Game.Loader.addMultiple({
      balloon: 'Spritesheet',
      balloonflip: 'Spritesheet'
    })

    const { healthBalloon } = this.stage.Game.lang.words
    this.typeWriter = new this.stage.Typewriter(healthBalloon[Math.floor(Math.random() * healthBalloon.length)])
    this.typeWriter.addEventListener('write', ({ detail }) => {
      this.writtenCharacters.push([detail.keyPressed, Date.now(), Math.random()])
    })
    this.typeWriter.addEventListener('done', ({ detail }) => {
      const { accuracy, cpm, deltaTime } = detail
      if (accuracy !== Infinity && cpm !== Infinity) {
        this.stage.Game.accuracyCollection.push(accuracy * 100),
        this.stage.Game.cpmCollection.push(cpm)
      }

      this.level.player.health = Math.min(this.level.player.health + 1, this.level.player.maxHealth)

      this.destroy()
    })
    this.typeWriter.addEventListener('err', () =>
      this.stage.shake = Date.now()
    )
  }

  update (dt) {
    this.pos[1] -= this.spd * dt
    this.offsetXPos = Math.sin((Date.now() - this.createdAt) / 500) * 12

    const { balloon } = this.stage.Game.Loader.loaded
    if (balloon.meta && this.pos[1] <= -balloon.meta.resolution[1]) { this.level.helpers.splice(this.level.helpers.indexOf(this), 1) }
  }

  render () {
    const { balloon, balloonflip, playerstareblink } = this.stage.Game.Loader.loaded
    if (!balloon.meta) return

    const sideBool = (this.level.player.pos[0] + playerstareblink.meta.resolution[0] / 4) - this.pos[0] < 0;
    (sideBool ? balloonflip : balloon).drawSprite(
      this.stage.ctx,
      this.pos[0] + (this.offsetXPos || 0),
      this.pos[1]
    )
  }
}

export class UmbrellaShield extends window.DefaultEnt {
  constructor (stage, level, x, y, params) {
    super(stage, level, x, y, params)

    this.spd = (this.params.spd || 4) * (60 / 1000)

    this.stage.Game.Loader.add('umbrella', 'Spritesheet')

    const { umbrellaShield } = this.stage.Game.lang.words
    this.typeWriter = new this.stage.Typewriter(umbrellaShield[Math.floor(Math.random() * umbrellaShield.length)])
    this.typeWriter.addEventListener('write', ({ detail }) => {
      this.writtenCharacters.push([detail.keyPressed, Date.now(), Math.random()])
    })
    this.typeWriter.addEventListener('done', ({ detail }) => {
      const { accuracy, cpm, deltaTime } = detail
      if (accuracy !== Infinity && cpm !== Infinity) {
        this.stage.Game.accuracyCollection.push(accuracy * 100),
        this.stage.Game.cpmCollection.push(cpm)
      }

      this.death = Date.now()
      this.level.player.shield = {
        x: this.pos[0] + (this.offsetXPos || 0),
        y: this.pos[1],
        appliedAt: Date.now(),
      }
      this.level.player.shieldSP = [
        {
          front: false,
          frontSwitchAt: 0
        },
        {
          front: true,
          frontSwitchAt: 0
        }
      ]
    })
    this.typeWriter.addEventListener('err', () =>
      this.stage.shake = Date.now()
    )
  }

  update (dt) {
    if (this.death) {
      if (Date.now() - this.death >= 500) { this.destroy() }
      return
    }

    this.pos[1] += this.spd * dt
    this.offsetXPos = Math.sin((Date.now() - this.createdAt) / 500) * 24

    const { umbrella } = this.stage.Game.Loader.loaded
    if (umbrella.meta && this.pos[1] >= this.stage.Game.height) { this.destroy() }
  }

  render () {
    if (this.death) { return }
    const { umbrella, playerstareblink } = this.stage.Game.Loader.loaded
    if (!umbrella.meta) return

    umbrella.drawSprite(
      this.stage.ctx,
      this.pos[0] + (this.offsetXPos || 0),
      this.pos[1]
    )
  }

  destroy () {
    this.level.helpers.splice(this.level.helpers.indexOf(this), 1)
  }
}
