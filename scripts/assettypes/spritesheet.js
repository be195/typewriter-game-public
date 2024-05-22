export class Spritesheet {
  constructor (_app, name) {
    this.name = name
    this.image = new Image()
    this.image.src = `assets/spritesheets/${name}/${name}.png`
    fetch(`assets/spritesheets/${name}/${name}.json`).then(
      async (i) => (this.meta = await i.json())
    )

    this.lastCheck = Date.now()
    this.currentX = 0
    this.currentY = 0
    this.noLoop = false
    this.stopBeforeLoop = false
  }

  drawSprite (ctx, x = 0, y = 0, scale = 1, animated = true, params = {}) {
    if (!this.meta) return
    /* const { frames } = this.meta;
    const currentFrame = animated
      ? Math.floor(((Date.now() / 1000) * speed) % frames.length)
      : 0;
    const frameMeta = frames[currentFrame].frame;
    this.currentFrame = currentFrame; */

    let {
      resolution,
      spritesPerY,
      fps,
      possibleY,
      spritesLastY,
      offset
    } = this.meta
    offset = offset || [0, 0]

    let currentX = typeof params.currentX === 'undefined' ? this.currentX : params.currentX
    let currentY = typeof params.currentY === 'undefined' ? this.currentY : params.currentY
    let lastCheck = typeof params.lastCheck === 'undefined' ? this.lastCheck : params.lastCheck
    const noLoop = typeof params.noLoop === 'undefined' ? this.noLoop : params.noLoop
    const stopBeforeLoop = typeof params.stopBeforeLoop === 'undefined' ? this.stopBeforeLoop : params.stopBeforeLoop

    const isLooping = noLoop && currentY === possibleY && currentX >= spritesLastY
    if (!isLooping && animated && Date.now() - lastCheck >= 1000 / fps) {
      currentX++
      lastCheck = Date.now()
    }
    if (!isLooping && currentX >= spritesPerY) { currentX = 0, currentY++ }
    if (!noLoop && (currentY >= possibleY || (spritesLastY !== -1 && currentY === possibleY - 1 && currentX >= spritesLastY)))
      if (!stopBeforeLoop) currentY = 0
      else currentX = spritesLastY - 1

    if (this.image.complete)
      ctx.drawImage(
        this.image,
        currentX * resolution[0],
        currentY * resolution[1],
        resolution[0],
        resolution[1],
        x + offset[0],
        y + offset[1],
        resolution[0] * scale,
        resolution[1] * scale
      )
    else {
      ctx.strokeStyle = '#BD2626'
      ctx.strokeRect(x, y, resolution[0] * scale, resolution[1] * scale)
    }

    params.currentX = this.currentX = currentX
    params.currentY = this.currentY = currentY
    params.lastCheck = this.lastCheck = lastCheck

    return params
  }
}
