class Game {
  constructor () {
    this.canvasElem = document.querySelector('#canvas')
    this.canvasCtx = this.canvasElem.getContext('2d')

    this.width = this.canvasElem.width
    this.height = this.canvasElem.height

    this.overlay = document.querySelector('.overlay')

    this.stages = {}
    this.stageOrigins = ['0.js', 'intro.js', 'gameplay/index.js']
    this.currentStage = 'NullStage'

    this.assetsPreload = {
      error: 'Image',
      keyclick1: 'Audio',
      keyclick2: 'Audio',
      keyclick3: 'Audio'
    }
    this.assetLoaderReady = false

    this.times = []

    this.colors = {
      brand: '#BD2626',
      brandComplementary: '#26BDBD'
    }

    this.cpmCollection = []
    this.accuracyCollection = []
    this.score = 0
    this.previousScore = 0
    this.latestScore = Date.now()

    this.UNKNOWN_ERR = -1
    this.RENDER_ERR = 0
    this.UPDATE_ERR = 1

    this.sentryEnabled = typeof Sentry !== 'undefined'

    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.audioCtx = new AudioContext()

    if (this.sentryEnabled) {
      Sentry.init({
        dsn: window.GLOBAL_ENV.SENTRY_DSN,
        integrations: [new Sentry.Integrations.BrowserTracing()],
        environment: window.GLOBAL_ENV.DEBUG ? 'development' : 'production',
        tracesSampleRate: 1.0
      })
    }

    this.addEvents()
    this.loadStages()
    window.requestAnimationFrame((t) => this.renderCanvas(t))
    // setInterval(() => this.updateCurrentStage(), 17); // 1000 / 60 = 17 (rounded)
  }

  get averageCPM() {
    return this.cpmCollection.reduce((pv, cv) => pv + cv, 0) / this.cpmCollection.length
  }

  get averageAccuracy() {
    return this.accuracyCollection.reduce((pv, cv) => pv + cv, 0) / this.accuracyCollection.length
  }

  async loadAssets () {
    const lang = await fetch('scripts/lang.json')
    this.lang = await lang.json()

    const { Loader } = await import('./loader.js')
    this.Loader = new Loader(this)

    this.Loader.addEventListener('ready', () => {
      this.Loader.addMultiple(this.assetsPreload);

      this.assetLoaderReady = true
    })
    this.Loader.addEventListener('loaded', ({ detail }) =>
      console.log('Loaded', detail)
    )
  }

  setScore (to) {
    this.latestScore = Date.now()
    this.previousScore = this.score
    this.score += to
  }

  addEvents () {
    const mouseEvents = [
      'mouseup',
      'mousedown',
      'mousemove',
      'click',
      'keydown',
      'keyup'
    ]
    for (const event of mouseEvents) {
      document.addEventListener(event, (e) => {
        if (this.errored) {
          if (event === 'keydown' && e.key.toLowerCase() === 'r') { window.location.reload(false) }
          return
        }
        const stage = this.stages[this.currentStage]
        if (stage) {
          if (event.startsWith('key')) stage.handleKeyEvent(e)
          else stage.handleMouseEvent(e)
        }
      })
    }

    window.addEventListener('error', ({ error }) => {
      console.error(error)
      if (this.sentryEnabled)
        Sentry.captureException(error, { tags: { type: 'global' } })
      this.errored = { type: this.UNKNOWN_ERR, err: error }
    })
  }

  async loadStages () {
    const { DefaultStage } = await import('./stages/default.js')
    window.DefaultStage = DefaultStage

    for (const stageOrigin of this.stageOrigins) {
      const Stage = new (await import(`./stages/${stageOrigin}`)).default(this)
      this.stages[Stage.constructor.name] = Stage
    }

    this.stages[this.currentStage].init()
  }

  switchStage (newSt) {
    if (!this.stages[newSt]) return

    this.currentStage = newSt
    this.stages[this.currentStage].init()
  }

  updateCurrentStage (time) {
    const stage = this.stages[this.currentStage]
    if (!stage) return
    const deltaTime = this.previousUpdateTime ? time - this.previousUpdateTime : 0;
    this.previousUpdateTime = time
    try {
      stage.update(deltaTime)
    } catch (err) {
      this.errored = { type: this.UPDATE_ERR, err }
      if (this.sentryEnabled)
        Sentry.captureException(err, { tags: { type: 'update' } })
      return console.error('Update error:', err)
    }
  }

  renderCurrentStage (time) {
    const stage = this.stages[this.currentStage]
    if (!stage) return
    try {
      stage.render(time)
    } catch (err) {
      this.errored = { type: this.RENDER_ERR, err }
      if (this.sentryEnabled)
        Sentry.captureException(err, { tags: { type: 'render' } })
      return console.error('Render error:', err)
    }
  }

  drawError () {
    this.canvasCtx.globalAlpha = 1
    const { width, height } = this.canvasElem

    this.canvasCtx.fillStyle = '#ddd'
    this.canvasCtx.fillRect(0, 0, width, height)

    const icon = this.Loader.loaded.error
    this.canvasCtx.drawImage(icon, width / 2 - icon.width / 2, height / 2 - icon.height / 2)

    const fontSize = 16
    const txtMargin = 4
    this.canvasCtx.textAlign = 'center'
    this.canvasCtx.font = fontSize + 'px "Roboto Mono"'
    this.canvasCtx.fillStyle = '#BD2626'

    let prefix = 'So long, and thanks for all the fish!'
    switch (this.errored.type) {
      case this.RENDER_ERR:
        prefix += ' (RE)'
        break
      case this.UPDATE_ERR:
        prefix += ' (UE)'
        break
    }

    const addText = this.sentryEnabled ?
      '' :
      '(Auto error reporting disabled.)';

    const x = width / 2
    const y = height / 2 + icon.height + txtMargin
    this.canvasCtx.fillText(prefix, x, y)
    this.canvasCtx.fillText(
      addText + ' Press R to reload the application.',
      x,
      y + fontSize + txtMargin
    )
  }

  renderCanvas (time) {
    if (this.errored) { return this.drawError() }

    const { width, height } = this.canvasElem
    this.canvasCtx.clearRect(0, 0, width, height)
    this.renderCurrentStage(time)
    this.updateCurrentStage(time)

    if (window.GLOBAL_ENV.DEBUG) {
      const now = performance.now()
      while (this.times.length > 0 && this.times[0] <= now - 1000) { this.times.shift() }
      this.times.push(now)

      const fps = this.times.length
      this.canvasCtx.font = '16px sans-serif'
      this.canvasCtx.fillStyle = 'black'
      this.canvasCtx.textAlign = 'left'
      this.canvasCtx.textBaseline = 'top'
      this.canvasCtx.fillText(fps, 0, 0)
    }

    window.requestAnimationFrame((t) => this.renderCanvas(t))
  }
}

window.game = new Game()
