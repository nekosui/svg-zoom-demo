import { createStore } from 'vuex'

type State = {
  name: string;
  token: string;
  refreshToken: string;
  tokenExpires: string;
}

const store = createStore({
  state () {
    return {
      name: '',
      token: '',
      refreshToken: '',
      tokenExpires: ''
    }
  },
  mutations: {
    login (state: State) {
      state.name = 'hello'
    },
    logout(state: State) {
      state.name = ''
    }
  }
})

export default store