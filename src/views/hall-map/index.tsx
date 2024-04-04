import { defineComponent, ref } from "vue";

import './index.styl'

type Point = {
  x: number,
  y: number
}

type Rect = {
  x: number,
  y: number,
  width: number,
  height: number,
}

/**
 * 获取两点之间的距离
 * @param p1 点1
 * @param p2 点2
 * @returns 距离
 */
const getPointDistance = (p1: Point, p2: Point) => {
  const dx = p1.x - p2.x
  const dy = p1.y - p2.y

  return Math.sqrt(dx * dx + dy * dy)
}

const getMiddlePoint = (p1: Point | Rect, p2: Point | Rect): Point => ({
  x: (p1.x + p2.x) / 2,
  y: (p1.y + p2.y) / 2
})

const getPositionInSvg = (svg: SVGGraphicsElement, e: MouseEvent | Touch): DOMPoint => {
  let x = 0
  let y = 0

  if (e instanceof MouseEvent) {
    x = e.clientX
    y = e.clientY
  } else { // e instanceof Touch
    x = e.clientX
    y = e.clientY
  }

  const domPoint = new DOMPoint(x, y)
  const pointInSvg = domPoint.matrixTransform(svg.getScreenCTM()?.inverse())
  return pointInSvg
}

const HallMap = defineComponent({
  setup() {
    const svgRef = ref<SVGGraphicsElement>()
    let touchStartDistance = 0
    const viewBoxText = ref('0 0 100 160')

    /** 按下时的viewBox数据 */
    let touchStartViewBox: Rect = { x: 0, y: 0, width: 100, height: 160 }
    let virtualNewViewBox = ref<Rect>({ x: 0, y: 0, width: 0, height: 0 })
    /** 按下时的中点坐标 (client) */
    let touchStartMiddlePoint: Point = { x: 0, y: 0 }
    /** 按下时的中点坐标 (svg画布内的) */
    let touchStartMiddlePointInSVG: Point = { x: 0, y: 0 }
    /** 拖动前，视窗的中心点坐标 */
    let middlePointInSVG: Point = { x: 0, y: 0 }
    let touchEndMiddlePointInSVGRef = ref<Point>({ x: 0, y: 0 })
    let clientPoint = ref<Point[]>([])

    const onTouchStart = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!svgRef.value || e.touches.length === 1) {
        return
      }

      const clientP1: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const clientP2: Point = { x: e.touches[1].clientX, y: e.touches[1].clientY }

      touchStartMiddlePoint = getMiddlePoint(clientP1, clientP2)
      touchStartDistance = getPointDistance(clientP1, clientP2)

      clientPoint.value = [touchStartMiddlePoint]

      const svgP1 = getPositionInSvg(svgRef.value, e.touches[0])
      const svgP2 = getPositionInSvg(svgRef.value, e.touches[1])
      touchStartMiddlePointInSVG = getMiddlePoint(svgP1, svgP2)

      middlePointInSVG = {
        x: touchStartViewBox.x + touchStartViewBox.width / 2,
        y: touchStartViewBox.y + touchStartViewBox.height / 2,
      }
    }

    const onTouchMove = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!svgRef.value || e.touches.length === 1) {
        return
      }

      const clientP1: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const clientP2: Point = { x: e.touches[1].clientX, y: e.touches[1].clientY }

      /** 两指中点的坐标，在client内的位置 */
      const touchEndMiddlePoint = getMiddlePoint(clientP1, clientP2)
      const touchEndDistance = getPointDistance(clientP1, clientP2)

      if (clientPoint.value.length === 1) {
        clientPoint.value.push(touchEndMiddlePoint)
      } else {
        clientPoint.value.splice(1, 1, touchEndMiddlePoint)
      }

      /** 缩放倍率 */
      const scale = touchEndDistance / touchStartDistance

      /** 新视窗 */
      const newViewBox = {
        x: 0,
        y: 0,
        width: touchStartViewBox.width / scale,
        height: touchStartViewBox.height / scale
      }

      /** 计算两指中点在client内的的移动向量（往哪里移，移动了多少） */
      const touchEndMiddlePointVector = {
        x: touchStartMiddlePoint.x - touchEndMiddlePoint.x,
        y: touchStartMiddlePoint.y - touchEndMiddlePoint.y,
        // x: touchEndMiddlePoint.x - touchStartMiddlePoint.x,
        // y: touchEndMiddlePoint.y - touchStartMiddlePoint.y,
      }

      /** 两指中点的坐标，在拖动改变viewBox前的svg内的位置 */
      const touchEndMiddlePointInSVG = {
        x : touchStartMiddlePointInSVG.x + touchEndMiddlePointVector.x / svgRef.value.clientWidth * touchStartViewBox.width,
        y : touchStartMiddlePointInSVG.y + touchEndMiddlePointVector.y / svgRef.value.clientHeight * touchStartViewBox.height,
      }

      touchEndMiddlePointInSVGRef.value = touchEndMiddlePointInSVG

      const originWidth = touchStartMiddlePointInSVG.x - touchStartViewBox.x
      const originHeight = touchStartMiddlePointInSVG.y - touchStartViewBox.y

      newViewBox.x = touchEndMiddlePointInSVG.x - originWidth / scale
      newViewBox.y = touchEndMiddlePointInSVG.y - originHeight / scale

      // virtualNewViewBox.value = newViewBox

      viewBoxText.value = [
        newViewBox.x,
        newViewBox.y,
        newViewBox.width,
        newViewBox.height
      ].join(' ')
    }

    const onTouchEnd = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      const arr = viewBoxText.value.split(' ')
      touchStartViewBox = {
        x: +arr[0],
        y: +arr[1],
        width: +arr[2],
        height: +arr[3]
      }

      clientPoint.value = []
    }

    return () => (
      <div class="bg-body-tertiary">
        <svg
          ref={svgRef}
          viewBox={viewBoxText.value}
          class="bg-body-tertiary"
          onTouchstart={onTouchStart}
          onTouchmove={onTouchMove}
          onTouchend={onTouchEnd}
        >
          <rect x="20" y="20" width={30} height={30} fill="#000" />
          <rect x="50" y="20" width={30} height={30} fill="#f00" />
          <rect x="20" y="50" width={30} height={30} fill="#0f0" />
          <rect x="50" y="50" width={30} height={30} fill="#00f" />
          <circle
            cx={touchEndMiddlePointInSVGRef.value.x}
            cy={touchEndMiddlePointInSVGRef.value.y}
            r={1}
            fill="#000"
          />
          <rect
            x={virtualNewViewBox.value.x}
            y={virtualNewViewBox.value.y}
            width={virtualNewViewBox.value.width}
            height={virtualNewViewBox.value.height}
            fill="transparent"
            stroke="#f00"
            stroke-width={1}
          />
        </svg>
        {
          clientPoint.value.map(p => (
            <div style={{
              position: 'absolute',
              zIndex: 4,
              left: p.x + 'px',
              top: p.y + 'px',
              width: '10px',
              height: '10px',
              backgroundColor: '#ff0',
              borderRadius: '50%'
            }}/>
          ))
        }
      </div>
    )
  }
})

export default HallMap
