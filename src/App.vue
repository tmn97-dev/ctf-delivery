<template>
  <div>
    <canvas ref="matrixCanvas" id="matrix-canvas"></canvas>
    <div class="app">
      <div class="app-header">
        <p class="main-text">
          Føler du at samfunnet kveler ditt potensiale?<br />
          Er du teknologisk begavet, men fanget i et system som ikke fortjener deg?<br />
          Blir du sett på som en del av maskinen?<br /><br />
          Fase 2 har begynt. Vi trenger deg.<br />
          Knus systemet — ikke bli igjen når murene faller.
        </p>

        <form class="form-container" @submit.prevent="handleSubmit">
          <input
            v-model="email"
            class="input"
            type="email"
            placeholder="E-post"
            required
            :disabled="loading"
          />
          <div class="button-group">
            <button class="button" type="submit" :disabled="loading">
              {{ loading ? 'Sender...' : 'Meld deg på' }}
            </button>
          </div>
        </form>

        <p v-if="statusMessage" class="status-message">{{ statusMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue'

export default defineComponent({
  name: 'App',
  setup() {
    const email = ref<string>('')
    const statusMessage = ref<string>('')
    const loading = ref<boolean>(false)
    const matrixCanvas = ref<HTMLCanvasElement | null>(null)

    let animationId: number | null = null

    const initMatrix = (): void => {
      const canvas = matrixCanvas.value
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*(){}[]|;:<>?'
      const charArray = chars.split('')
      const fontSize = 14
      const columns = Math.floor(canvas.width / fontSize)

      const drops: number[] = []
      for (let i = 0; i < columns; i++) {
        drops[i] = Math.random() * -100
      }

      const draw = (): void => {
        // Slight fade effect for trail
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        ctx.fillStyle = '#0f0'
        ctx.font = `${fontSize}px monospace`

        for (let i = 0; i < drops.length; i++) {
          // Random character
          const char = charArray[Math.floor(Math.random() * charArray.length)]
          const x = i * fontSize
          const y = drops[i] * fontSize

          // Brighter green for the leading character
          if (Math.random() > 0.98) {
            ctx.fillStyle = '#fff'
          } else if (Math.random() > 0.9) {
            ctx.fillStyle = '#5f5'
          } else {
            ctx.fillStyle = '#0f0'
          }

          ctx.fillText(char, x, y)

          // Reset drop to top randomly or when off screen
          if (y > canvas.height && Math.random() > 0.975) {
            drops[i] = 0
          }

          drops[i]++
        }

        // Random glitch effect
        if (Math.random() > 0.99) {
          const glitchHeight = Math.random() * 50
          const glitchY = Math.random() * canvas.height
          ctx.drawImage(
            canvas,
            0, glitchY, canvas.width, glitchHeight,
            Math.random() * 20 - 10, glitchY, canvas.width, glitchHeight
          )
        }

        animationId = requestAnimationFrame(draw)
      }

      draw()
    }

    const handleResize = (): void => {
      const canvas = matrixCanvas.value
      if (canvas) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }
    }

    onMounted(() => {
      initMatrix()
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
      window.removeEventListener('resize', handleResize)
    })

    const handleSubmit = async (): Promise<void> => {
      const emailRegex = /\S+@\S+\.\S+/
      if (!emailRegex.test(email.value.toLowerCase())) {
        statusMessage.value = 'Ugyldig e-postadresse. Skriv inn en gyldig e-post.'
        return
      }

      loading.value = true

      try {
        const response = await fetch('/api/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: email.value }),
        })

        const data = await response.json()

        if (response.ok) {
          statusMessage.value = 'Du hører fra oss.'
          email.value = ''
        } else {
          statusMessage.value = `Påmelding feilet: ${data.message}`
        }
      } catch {
        statusMessage.value = 'Påmelding feilet. Nettverksfeil.'
      } finally {
        loading.value = false
      }
    }

    return {
      email,
      statusMessage,
      loading,
      handleSubmit,
      matrixCanvas,
    }
  },
})
</script>
