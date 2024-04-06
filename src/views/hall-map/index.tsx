import { computed, defineComponent, onMounted, ref } from "vue";

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

const getClientPoint = (e: MouseEvent | Touch): Point => ({
  x: e.clientX,
  y: e.clientY,
})

/** client坐标转成svg内坐标 */
const getPositionInSvg = (svg: SVGGraphicsElement, e: MouseEvent | Touch | Point): DOMPoint => {
  let x = 0
  let y = 0

  if (e instanceof MouseEvent) {
    x = e.clientX
    y = e.clientY
  } else if (e instanceof Touch) {
    x = e.clientX
    y = e.clientY
  } else {
    x = e.x
    y = e.y
  }

  const domPoint = new DOMPoint(x, y)
  const pointInSvg = domPoint.matrixTransform(svg.getScreenCTM()?.inverse())
  return pointInSvg
}

const getInitialViewBox = function(slide: 'width' | 'height', size: number = 100) {
  const svgRef = ref<SVGGraphicsElement>()
  const viewBox = ref<Rect>({ x: 0, y: 0, width: 100, height: 100 })
  const viewBoxText = computed(() => [
    viewBox.value.x,
    viewBox.value.y,
    viewBox.value.width,
    viewBox.value.height
  ].join(' '))

  onMounted(() => {
    if (!svgRef.value) {
      return
    }

    if (slide === 'width') {
      const vh = svgRef.value.clientHeight / svgRef.value.clientWidth * size
      viewBox.value = {x: 0, y: 0, width: size, height: vh}
    } else { // slide === 'height'
      const vw = svgRef.value.clientWidth / svgRef.value.clientHeight * size
      viewBox.value = {x: 0, y: 0, width: vw, height: size}
    }
  })

  return { svgRef, viewBox, viewBoxText }
}

const HallMap = defineComponent({
  setup() {
    const moving = ref(false)
    const { svgRef, viewBox, viewBoxText } = getInitialViewBox('height', 300)
    let touchStartDistance = 0
    /** 按下时的viewBox */
    let touchStartViewBox = {...viewBox.value}
    /** 按下时的中点坐标 (client) */
    let startPoint: Point = { x: 0, y: 0 }
    /** 按下时的中点坐标 (svg画布内的) */
    let touchStartMiddlePointInSVG: Point = { x: 0, y: 0 }
    /** viewBox宽高和svg元素宽高的比值 */
    let ratio = { w: 1, h: 1 }
    /** 按下时的viewBox的xy与按下时的中点的xy的差 */
    let diffBetweenViewBoxAndTouchPoint: Point = { x: 0, y: 0 }

    const getViewBoxRatio = () => {
      if (!svgRef.value) return
      ratio = {
        w: svgRef.value.clientWidth / viewBox.value.width,
        h: svgRef.value.clientHeight / viewBox.value.height
      }
    }

    const onTouchStart = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!svgRef.value || e.touches.length === 1) {
        return
      }

      const clientP1: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const clientP2: Point = { x: e.touches[1].clientX, y: e.touches[1].clientY }

      startPoint = getMiddlePoint(clientP1, clientP2)
      touchStartMiddlePointInSVG = getPositionInSvg(svgRef.value, startPoint)
      touchStartDistance = getPointDistance(clientP1, clientP2)
      touchStartViewBox = {...viewBox.value}
      diffBetweenViewBoxAndTouchPoint = {
        x: touchStartMiddlePointInSVG.x - touchStartViewBox.x,
        y: touchStartMiddlePointInSVG.y - touchStartViewBox.y,
      }

      moving.value = true
    }
    const onTouchMove = function(e: TouchEvent) {
      if (!svgRef.value) return
      if (!moving.value) return

      const clientP1: Point = getClientPoint(e.touches[0])
      const clientP2: Point = getClientPoint(e.touches[1])
      const currentPoint = getMiddlePoint(clientP1, clientP2)
      const touchEndDistance = getPointDistance(clientP1, clientP2)

      /** 缩放倍率 */
      const scale = touchStartDistance / touchEndDistance

      const clientVector = {
        x: currentPoint.x - startPoint.x,
        y: currentPoint.y - startPoint.y,
      }

      const svgVector = {
        x: clientVector.x / ratio.w,
        y: clientVector.y / ratio.h,
      }

      viewBox.value = {
        x: touchStartMiddlePointInSVG.x - (diffBetweenViewBoxAndTouchPoint.x + svgVector.x) * scale,
        y: touchStartMiddlePointInSVG.y - (diffBetweenViewBoxAndTouchPoint.y + svgVector.y) * scale,
        width: touchStartViewBox.width * scale,
        height: touchStartViewBox.height * scale,
      }
    }
    const onTouchEnd = () => {
      moving.value = false
      if (!svgRef.value) return
      getViewBoxRatio()
    }

    return () => (
      <div class="bg-body-tertiary" style="display:flex;align-items:center;justify-content:center;height:100%">
        <svg
          style="border:solid 1px #000;margin:auto;"
          ref={svgRef}
          viewBox={viewBoxText.value}
          class="bg-body-tertiary"
          width="80%"
          height="80%"
          onTouchstart={onTouchStart}
          onTouchmove={onTouchMove}
          onTouchend={onTouchEnd}
        >
          <rect x="7" y="20" width={30} height={30} fill="#000" />
          <rect x="37" y="20" width={30} height={30} fill="#f00" />
          <rect x="7" y="50" width={30} height={30} fill="#0f0" />
          <rect x="37" y="50" width={30} height={30} fill="#00f" />
        </svg>
      </div>
    )
  }
})

export default HallMap
