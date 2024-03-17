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
    const touchStartDistance = ref(0)
    const viewBoxText = ref('0 0 100 160')
    const count = ref(-1)
    const touchStartViewBox = ref<Rect>({
      x: 0,
      y: 0,
      width: 100,
      height: 160
    })
    const touchStartMiddlePoint = ref<Point>({ x: 0, y: 0 })
    const touchStartMiddlePointInSVG = ref<Point>({ x: 0, y: 0 })
    const touchFirstPoint = ref<Point>({ x: 0, y: 0 })
    const touchEndMiddlePoint = ref<Point>({ x: 0, y: 0 })
    const touchEndMiddlePointVector = ref<Point>({ x: 0, y: 0 })
    const showRect = ref<Rect[]>([])
    const showClientRect = ref<Rect[]>([])

    const onTouchStart = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!svgRef.value || e.touches.length === 1) {
        return
      }

      const clientP1: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const clientP2: Point = { x: e.touches[1].clientX, y: e.touches[1].clientY }

      touchStartMiddlePoint.value = getMiddlePoint(clientP1, clientP2)
      touchStartDistance.value = getPointDistance(clientP1, clientP2)

      const svgP1 = getPositionInSvg(svgRef.value, e.touches[0])
      const svgP2 = getPositionInSvg(svgRef.value, e.touches[1])
      touchStartMiddlePointInSVG.value = getMiddlePoint(svgP1, svgP2)

      count.value = -1
    }

    const onTouchMove = function(e: TouchEvent) {
      e.stopPropagation()
      e.preventDefault()

      if (!svgRef.value || e.touches.length === 1) {
        return
      }

      const clientP1: Point = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      const clientP2: Point = { x: e.touches[1].clientX, y: e.touches[1].clientY }

      const _touchEndMiddlePoint = getMiddlePoint(clientP1, clientP2)
      const touchEndDistance = getPointDistance(clientP1, clientP2)

      const scale = touchEndDistance / touchStartDistance.value

      const newViewBox = {
        x: 0,
        y: 0,
        width: touchStartViewBox.value.width / scale,
        height: touchStartViewBox.value.height / scale
      }

      const _touchEndMiddlePointVector = {
        x: touchStartMiddlePoint.value.x - _touchEndMiddlePoint.x,
        y: touchStartMiddlePoint.value.y - _touchEndMiddlePoint.y,
      }

      const touchEndMiddlePointInSVG = {
        x : touchStartMiddlePointInSVG.value.x + _touchEndMiddlePointVector.x / svgRef.value.clientWidth * newViewBox.width,
        y : touchStartMiddlePointInSVG.value.y + _touchEndMiddlePointVector.y / svgRef.value.clientHeight * newViewBox.height,
      }

      touchEndMiddlePointVector.value = newViewBox

      newViewBox.x = touchEndMiddlePointInSVG.x - newViewBox.width / 2,
      newViewBox.y = touchEndMiddlePointInSVG.y - newViewBox.height / 2

      console.log('newViewBox')

      // count.value++
      // if (count.value < 5) {
      //   return
      // }

      viewBoxText.value = [
        newViewBox.x,
        newViewBox.y,
        newViewBox.width,
        newViewBox.height
      ].join(' ')
    }

    const onTouchEnd = function(e: TouchEvent) {
      console.log('onTouchEnd')
      e.stopPropagation()
      e.preventDefault()

      // if (!svgRef.value || e.touches.length === 1) {
      //   return
      // }

      const arr = viewBoxText.value.split(' ')
      touchStartViewBox.value = {
        x: +arr[0],
        y: +arr[1],
        width: +arr[2],
        height: +arr[3]
      }
    }

    return () => (
      <div class="bg-body-tertiary">
        <svg
          ref={svgRef}
          viewBox={viewBoxText.value}
          class="bg-body-tertiary"
          // style="border:solid 1px #000;box-sizing:border-box;width:100%"
          onTouchstart={onTouchStart}
          onTouchmove={onTouchMove}
          onTouchend={onTouchEnd}
        >
          <rect x="20" y="20" width={30} height={30} fill="#000" />
          <rect x="50" y="20" width={30} height={30} fill="#f00" />
          <rect x="20" y="50" width={30} height={30} fill="#0f0" />
          <rect x="50" y="50" width={30} height={30} fill="#00f" />
          <circle cx={touchFirstPoint.value.x} cy={touchFirstPoint.value.y} r="20" fill="#0ff" />
          {
            // showRect.value.map((rect, i) => (
            //   <rect
            //     x={rect.x}
            //     y={rect.y}
            //     width={rect.width}
            //     height={rect.height}
            //     fill="transparent"
            //     stroke={i === 0 ? "#f00" : "#000"}
            //     stroke-width={10}
            //   />
            // ))
          }
        </svg>
        <div>{JSON.stringify(touchEndMiddlePointVector.value)}</div>
        {
          // showClientRect.value.map((rect, i) => (
          //   <div style={{
          //     position: "absolute",
          //     left: rect.x + 'px',
          //     top: rect.y + 'px',
          //     width: rect.width + 'px',
          //     height: rect.height + 'px',
          //     border: 'solid 1px #' + (i === 0 ? '0f0' : '0ff')
          //   }}></div>
          // ))
        }
      </div>
    )
  }
})

export default HallMap