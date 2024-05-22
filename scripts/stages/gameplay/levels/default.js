export default class DefaultLevel {
  constructor (stage, background) {
    this.stage = stage
    this.game = stage.Game
    this.enemies = []
    this.helpers = []
    this.player = new this.stage.Player(this.stage, this, 0, 0)

    this.game.Loader.add(background, 'Image')
    this.background = this.game.Loader.loaded[background]

    this.metadata = {
      id: 0,
      name: 'untitled'
    }
    this.metadataDuration = 5000

    this.words = {
      enemy: [
        'why isnt the coding finished',
        'the quick brown fox jumps over the lazy dog',
        'slight smile',
        'lorem ipsum dolor sit amet'
      ]
    }
    this.usedWords = {}

    this.particles = []
    for (let i = 0; i < 64; i++)
      this.particles.push([Math.random(), Math.random(), Math.random()])

    this.runTiming()
  }

  timeout (ms) {
    return () => new Promise(res => setTimeout(() => res(), ms))
  }

  get randomEnemyWord () {
    let word = this.words.enemy[Math.floor(Math.random() * this.words.enemy.length)]
    let iteration = this.words.enemy.length;
    while (word in this.usedWords) {
      if (iteration === 0) {
        throw new Error('Preventing an infinite loop!')
        break
      }

      word = this.words.enemy[Math.floor(Math.random() * this.words.enemy.length)]
      iteration--
    }
    this.usedWords[word] = true
    return word
  }

  spawnEnemyAsyncless (who, pos, word = this.randomEnemyWord, nMv) {
    const Enemy = this.stage.enemyEnts[who]
    if (Enemy) {
      const enemy = new Enemy(this.stage, this, pos[0], pos[1], { word, spd: 0.75 })

      if (enemy.typeWriter)
        enemy.typeWriter.addEventListener('write', ({ detail }) =>
          this.player && this.player.onHit(detail.keyPressed)
        )
      else if (enemy.eventTarget)
        enemy.eventTarget.addEventListener('typeWriterCreated', () =>
          enemy.typeWriter.addEventListener('write', ({ detail }) =>
            this.player && this.player.onHit(detail.keyPressed)
          )
        )

      enemy.noMove = nMv
      return enemy
    }
  }

  spawnHealthBalloon () {
    const x = Math.floor(Math.random() * (this.stage.Game.width - 256))
    const balloon = new this.stage.helperEnts.HealthBalloon(this.stage, this, x, this.stage.Game.height)

    this.helpers.push(balloon)
  }

  spawnUmbrellaShield () {
    const x = Math.floor(Math.random() * (this.stage.Game.width - 256))
    const balloon = new this.stage.helperEnts.UmbrellaShield(this.stage, this, x, -256)

    this.helpers.push(balloon)
  }

  spawnEnemy (who, pos, word, nMv) {
    return () => new Promise((res) => {
      const enemy = this.spawnEnemyAsyncless(who, pos, word, nMv)
      enemy.eventTarget.addEventListener('death', () => res())
    })
  }

  async runTiming () {
    for (const time of this.timing) { await time() }
  }

  get timing () {
    return []
  }

  render () {
    this.stage.ctx.drawImage(this.background, 0, 0)
    this.additionalBackgroundRender()
    for (const helper of this.helpers) {
      helper.render(),
      helper.renderOverlay()
    }
    this.player.render()
    for (const enemy of this.enemies) {
      enemy.render(),
      enemy.renderOverlay()
    }
    this.player.renderOverlay()
    this.additionalRender()

    this.renderMetadata()
  }

  renderMetadata() {
    if (this.showingMetadata && (Date.now() - this.showingMetadata < this.metadataDuration)) {
      const time = Date.now() - this.showingMetadata

      const { ctx } = this.stage
      const { width, height } = this.game
      ctx.save()
      const fadeInFactor = Math.min(time / 500, 1)
      const easeOutFactor = 1 - Math.pow(1 - fadeInFactor, 2)
      ctx.globalAlpha = fadeInFactor

      const bw = width,
        bh = height * 0.1;
      const by = this.stage.lerp(-bh, 0, fadeInFactor)

      ctx.fillStyle = 'rgba(255, 255, 255, 1)'
      ctx.rect(0, by, bw, bh)
      ctx.fill()
      ctx.clip()

      ctx.fillStyle = this.game.colors.brand + '32'
      for (const index in this.particles) {
        const [ cx, cy, random ] = this.particles[index]
        const sine = Math.sin(Date.now() / 1000 + random * 64)
        ctx.beginPath()
        ctx.arc(cx * bw - 2, cy * bh - 2 + sine * 16, 4, 0, 2 * Math.PI, false)
        ctx.fill()

        let newCx = cx + .01 * random
        newCx = newCx >= 1.01 ? -0.01 : newCx

        this.particles[index] = [ newCx, cy, random ]
      }

      const lineEndX = bw * ((time - 1000) / (this.metadataDuration - 1000))
      ctx.strokeStyle = this.game.colors.brand
      ctx.beginPath()
      ctx.moveTo(0, bh - 1)
      ctx.lineTo(lineEndX, bh - 1)
      ctx.lineWidth = 4
      ctx.stroke()

      const fontSize = bh - 32

      const lines = [ 2000, 3000, 4000 ]
      let curLine = false
      for (let line in lines)
        if (time >= lines[line])
          curLine = line

      ctx.fillStyle = this.game.colors.brand
      if (curLine) {
        const fs = fontSize * 0.4
        ctx.font = `400 ${fs}px Mali`
        ctx.textBaseline = 'top'
        ctx.textAlign = 'right'

        const t = time - lines[curLine]
        const easeInOut = 1 - Math.pow(1 - Math.min(t / 500, 1), 2)
        const { readySetGo } = this.game.lang

        ctx.save()
        ctx.globalAlpha = easeInOut
        ctx.fillText(readySetGo[curLine], lineEndX, bh - fs - 8 + fs * (1 - easeInOut))
        ctx.restore()

        if (readySetGo[curLine - 1]) {
          ctx.save()
          ctx.globalAlpha = 1 - easeInOut
          ctx.fillText(readySetGo[curLine - 1], lineEndX, bh - fs - 8 - fs * easeInOut)
          ctx.restore()
        }
      }

      ctx.font = `400 ${fontSize}px Mali`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      const finalYPos = height * 0.3
      const textYPart = bw / 4
      ctx.fillText(
        `Level ${this.metadata.id + 1}`,
        textYPart,
        bh / 2
      )

      ctx.restore()

      if (time >= 1000) {
        ctx.save()
        ctx.globalAlpha = Math.min((time - 1000) / 500, 1)
        ctx.font = `400 ${fontSize * 0.75}px Mali`
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.fillStyle = this.game.colors.brand
        ctx.fillText(
          `"${this.metadata.name}"`,
          textYPart * 3,
          bh / 2
        )
        ctx.restore()
      }
    }
  }

  handleKeyEvent (e) {
    if (e.type !== 'keydown' || (this.player && this.player.death)) return
    let makeSound
    const helperResults = []
    const enemyResults = []

    for (const helper of this.helpers) { helperResults.push(helper.typeWriter.canBeProcessed(e)) }
    for (const enemy of this.enemies) { enemyResults.push(enemy.typeWriter ? enemy.typeWriter.canBeProcessed(e) : false) }

    if (!helperResults.reduce((pV, cV) => pV || cV, false) && !enemyResults.reduce((pV, cV) => pV || cV, false)) {
      for (const helper of this.helpers) { makeSound = helper.handleKeyEvent(e) }
      for (const enemy of this.enemies) { makeSound = enemy.handleKeyEvent(e) }
    } else {
      helperResults.forEach((res, index) =>
        res && (makeSound = this.helpers[index].handleKeyEvent(e))
      )

      enemyResults.forEach((res, index) =>
        res && (makeSound = this.enemies[index].handleKeyEvent(e))
      )
    }

    if (makeSound) {
      const sound = 1 + Math.floor(Math.random() * 3)
      this.stage.Game.Loader.loaded['keyclick' + sound].play()
    }
  }

  update (dt) {
    for (const helper of this.helpers) { helper.update(dt) }
    for (const enemy of this.enemies) { enemy.update(dt) }
    this.additionalUpdate(dt)
  }

  showMetadata () {
    return async () => {
      this.showingMetadata = Date.now()
      await this.timeout(this.metadataDuration)()
    }
  }

  additionalUpdate() {}
  additionalBackgroundRender() {}
  additionalRender() {}
}
