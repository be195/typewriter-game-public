export default class Level extends window.DefaultLevel {
  constructor (stage) {
    super(stage, 'level0')

    this.metadata = {
      id: 0,
      name: 'Low Clouds'
    }

    this.player.pos = [515, 200]
    this.words = this.game.lang.words.levels[this.metadata.id]

    this.game.Loader.add('bgcloud0', 'Spritesheet')
    this.game.Loader.add('bgcloud1', 'Spritesheet')

    this.clouds = [
      [0.2, 1, [200, 100], Math.random()],
      [0.6, 0, [100, 300], Math.random()],
      [0.4, 1, [600, 200], Math.random()],
      [0.2, 0, [400, 400], Math.random()],
      [0.8, 0, [900, 500], Math.random()],
      [0.5, 1, [-200, -100], Math.random()],
      [0.8, 1, [360, -150], Math.random()],
      [0.3, 0, [900, -60], Math.random()],
    ]
  }

  move (entity, from, to) {
    return new Promise((callback) => {
      entity.pos = from
      this.moveInfo = {
        callback,
        entity,
        // speed: [(to[0] - from[0]) / 120, (to[1] - from[1]) / 120]
        from,
        to,
        started: Date.now()
      }
    })
  }

  spawnClassicEnemyTutorial (word, initPos, finalPos, txtId) {
    return () => new Promise(async (res) => {
      const enemy = this.spawnEnemyAsyncless('classic', initPos, word, true)
      enemy.eventTarget.addEventListener('death', () => {
        this.tutorial = false
        res()
      })
      await this.move(enemy, initPos, finalPos)
      enemy.pos = finalPos
      this.tutorial = this.stage.Game.lang.tutorial[txtId]
    })
  }

  get timing () {
    const { tutorial } = this.game.lang.words
    return [
      this.spawnClassicEnemyTutorial(tutorial[0], [1280, 365], [860, 225], 0),
      this.spawnClassicEnemyTutorial(tutorial[1], [-256, 0], [64, 160], 1),
      this.showMetadata(),
      () => Promise.all([
        this.spawnEnemy('classic', [0, 256])(),
        this.spawnEnemy('classic', [1024, 256])()
      ]),
      () => Promise.all([
        this.spawnEnemy('classic', [0, 128])(),
        this.spawnEnemy('classic', [128, 520])(),
        this.spawnEnemy('classic', [1024, 64])()
      ]),
      async () => {
        this.spawnUmbrellaShield();
        await this.timeout(2000)();

        return Promise.all([
          this.spawnEnemy('classic', [64, 360])(),
          this.spawnEnemy('classic', [180, 32])(),
          this.spawnEnemy('classic', [1100, 460])()
        ])
      },
      () => new Promise(async (res) => {
        const initPos = [128, -180]
        const finalPos = [128, 256]
        const enemy = this.spawnEnemyAsyncless('lightningcloud', finalPos, this.words.boss, true)
        enemy.eventTarget.addEventListener('death', () => res())

        await this.move(enemy, initPos, finalPos)
        enemy.noMove = false
        enemy.pos = finalPos
      }),
    ]
  }

  additionalBackgroundRender () {
    const { loaded } = this.game.Loader
    const { ctx } = this.stage

    for (const [ alpha, type, pos, rand ] of this.clouds) {
      const sprite = loaded['bgcloud' + type]
      const sine = Math.sin(Date.now() / 1000 + 64 * rand)
      ctx.save()
      ctx.globalAlpha = alpha
      sprite.drawSprite(ctx, pos[0], pos[1] + alpha * sine * 32)
      ctx.restore()
    }
  }

  additionalRender () {
    const { width, height } = this.stage.Game
    const { ctx } = this.stage

    if (this.tutorial) {
      const bW = width * 0.8
      const bH = height * 0.2
      const bY = 32
      ctx.strokeStyle = 'transparent'
      ctx.fillStyle = 'rgba(0, 0, 0, .64)'
      this.stage.roundRect(
        width / 2 - bW / 2,
        bY,
        bW,
        bH,
        64,
        true
      )

      const fontSize = 32
      ctx.font = `500 ${fontSize}px Mali`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'

      const allTxt = this.tutorial.split('\n')
      const tY = bY + bH / 2 - (fontSize * allTxt.length) / 2

      ctx.fillStyle = 'white'
      for (let i = 0; i < allTxt.length; i++) { ctx.fillText(allTxt[i], width / 2, tY + fontSize * i) }
    }
  }

  additionalUpdate (dt) {
    if (this.moveInfo) {
      const { started, callback, entity, from, to } = this.moveInfo
      const time = Date.now() - started
      if (time >= 2000) { return callback(), this.moveInfo = false }
      entity.pos = [
        this.stage.lerp(from[0], to[0], time / 2000),
        this.stage.lerp(from[1], to[1], time / 2000)
      ]
    }
  }
}
