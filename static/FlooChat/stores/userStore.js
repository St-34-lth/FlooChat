Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    userSession: null,
  },
  mutations: {
    setUserSession(state, session) {
      state.userSession = session;
    },
  },
  actions: {
    async fetchUserSession({ commit }) {
      try {
        let response = await axios.get("/api/current-user/");
        commit("setUserSession", response.data); // Assuming the session data is in the response.data property
      } catch (error) {
        console.error("Error fetching user session: ", error);
        // You might also want to handle this error in your UI
      }
    },
  },
  getters: {
    userSession: (state) => state.userSession,
  },
});
