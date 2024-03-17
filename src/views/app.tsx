import { defineComponent } from 'vue'
import { RouterView, RouterLink } from 'vue-router'
import { useStore } from 'vuex'

const App  = defineComponent({
  components: {
    RouterView
  },
  render() {
    return (
      <router-view></router-view>
    )
  }
})

export default App