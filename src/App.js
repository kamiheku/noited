import { useCallback, useEffect, useRef, useState } from 'react'
import { directoryOpen } from 'browser-fs-access'
import { XMLParser } from 'fast-xml-parser'

import MapImage from './map.png'

const WIDTH = 8417
const HEIGHT = 5000
const OFFSET_X = 3910
const OFFSET_Y = 480
const SCALE = 3.7
const MARKER_SIZE = 20
const MARKER_STROKE_WIDTH = 10
const MARKER_STROKE_COLOR = 'red'
const MARKER_FILL = 'white'

const convertCoords = (x, y) => ({
  x: x / SCALE + OFFSET_X,
  y: y / SCALE + OFFSET_Y
})

const xmlParser = new XMLParser({ ignoreAttributes: false })

const blobToSession = async (blob) => {
  const text = await blob.text()
  const stats = xmlParser.parse(text).Stats.stats

  const x = Number(stats?.['@_death_pos.x'])
  const y = Number(stats?.['@_death_pos.y'])

  if (!x || !y) return null

  return { x, y }
}

const isStatsXml = (blob) =>
  blob.name.endsWith('stats.xml')

function App () {
  const canvasEl = useRef(null)

  const [sessions, setSessions] = useState(null)

  const pickDirectory = useCallback(
    async () => {
      const dirContents = await directoryOpen({ recursive: false })
      const parsedSessions = await Promise.all(
        dirContents
          .filter(isStatsXml)
          .map(blobToSession)
      )
      setSessions(
        parsedSessions.filter(Boolean)
      )
    },
    []
  )

  useEffect(() => {
    if (!canvasEl.current || !sessions) {
      return
    }

    const ctx = canvasEl.current.getContext('2d')

    const mapImg = new Image()
    mapImg.src = MapImage
    mapImg.onload = () => {
      ctx.drawImage(mapImg, 0, 0)
      ctx.fillStyle = MARKER_FILL
      ctx.strokeStyle = MARKER_STROKE_COLOR
      ctx.lineWidth = MARKER_STROKE_WIDTH

      for (const session of sessions) {
        const { x, y } = session
        const imgCoords = convertCoords(x, y)
        ctx.beginPath()
        ctx.arc(
          imgCoords.x,
          imgCoords.y,
          MARKER_SIZE,
          0,
          2 * Math.PI,
          false
        )
        ctx.fill()
        ctx.stroke()
      }
    }
  }, [sessions])

  return (
    <>
      <h2>Usage</h2>

      <p>
        Just click the button below and open your Noita <code>sessions</code> folder. Then wait a bunch of time, after which the map should be displayed in the gray box below. It might also crash your browser if too many deaths have been recorded, who knows really!
      </p>

      <p>
        On Windows, the <code>sessions</code> folder is located at <code>C:\Users\YOUR_NAME_HERE\AppData\LocalLow\Nolla_Games_Noita\save00\stats\sessions</code>
      </p>

      <p>
        <strong>Note:</strong> For some reason, not all deaths are logged properly (no coordinates stored in the XML) and thus not displayed &#8212; could be deaths before a certain version?
      </p>

      <p>
        <strong>Another note:</strong> Your data doesn't leave your computer, all processing is client-side. Check your DevTools tab if you don't believe me!
      </p>

      <button onClick={pickDirectory}>
        Open your Noita sessions folder
      </button>

      <div>
        <canvas
          ref={canvasEl}
          id='map'
          width={WIDTH}
          height={HEIGHT}
        />
      </div>
    </>
  )
}

export default App
