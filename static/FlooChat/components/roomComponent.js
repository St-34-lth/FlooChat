export default function userChatApp() { return new Vue({
  el: "#userChatApp",
  delimiters: ["!{", "}"],
  data: {
    userInput: "",
    roomName: "",
    socket: null,
    messages: [],
    newMessage: "",
    errorMessage: "",
    currentUser: {
      id: "",
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      profile_pic: null,
      isViewing: false,
    },
    viewingUser: {
      id: "",
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      profile_pic: null,
      isViewing: false,
    },
  },
  methods: {
    async fetchCurrentUser() {
      try {
        let userIdFromURL = this.getIdfromURL();
        let res = await axios.get("/api/current-user/");
        if (res.status == 200) {
          this.currentUser.isAuthenticated = true;
          this.currentUser = res.data;
          if (userIdFromURL === "" || userIdFromURL === this.currentUser.id) {
            this.currentUser.isViewing = false;
          } else {
            this.currentUser.isViewing = true;
            let res = await axios.get(`/api/user/${userIdFromURL}/`);
            this.viewingUser = res.data;
          }
        }
      } catch (error) {
        if (error.response && error.response.status === 401) {
          if (
            this.currentUser.id == "" &&
            this.currentUser.isAuthenticated == false
          ) {
            console.error("Error: Unauthorized access."); // Logging error message to console
          }
        }
      }
    },
    onUserInput(e) {
      console.log(this.userInput);
      if (this.socket) {
        this.socket.send(JSON.stringify({ message: this.userInput }));
      } else {
        console.log("Socket is not initialized.");
      }
    },
    sendMessage() {
      if (this.socket) {
        if (this.errorMessage.trim() !== "") {
          console.log(this.errorMessage);
        }

        if (this.newMessage.trim() !== "") {
          console.log(this.newMessage);

          this.socket.send(JSON.stringify({ message: this.newMessage }));

          this.newMessage = "";
        }
      } else {
        console.log("Socket is not initialized.");
      }
    },
  },
  mounted() {
    let csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");

    axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
      
    this.$refs.messageInput.focus();
    this.roomName = window.location.pathname.split("/");
    this.socket = new WebSocket(
      `ws://${window.location.host}/ws/chat/${this.roomName.at(2)}/`
    ); //

    // Listen for messages from the server
    this.socket.onmessage = (event) => {
        console.log(event)
      const message = JSON.parse(event.data);
      console.log(message);
      this.messages.push(message);
      this.currentUser= message.user
    };

    this.socket.onerror = (error) => {
      this.errorMessage = error;
    };

    this.socket.onclose = (event) => {
      this.errorMessage = `WebSocket closed: ${event.code} - ${event.reason}`;
    };
  
  },
  created() {},
  template: `
<div class="page-content page-container" id="page-content">
    <div class="padding">
        <div class="row container d-flex justify-content-center">
<div class="col-md-6">
            <div class="card card-bordered">
              <div class="card-header">
                <h4 class="card-title"><strong>Chat</strong></h4>
                <a class="btn btn-xs btn-secondary" href="#" data-abc="true">Chatting</a>
              </div>
              <div class="ps-container ps-theme-default ps-active-y" id="chat-content" style="overflow-y: scroll !important; height:400px !important;">
                        <div v-for="msg in messages" class="media media-chat">
                            <img class="avatar" :src="currentUser.profile_pic" :alt="currentUser.username">
                            <div class="media-body">
                                <p>!{msg.message}</p>
                                <p class="meta"><time datetime="2018"></time></p>
                            </div>
                        </div>
              <div class="ps-scrollbar-x-rail" style="left: 0px; bottom: 0px;"><div class="ps-scrollbar-x" tabindex="0" style="left: 0px; width: 0px;"></div></div><div class="ps-scrollbar-y-rail" style="top: 0px; height: 0px; right: 2px;"><div class="ps-scrollbar-y" tabindex="0" style="top: 0px; height: 2px;"></div></div></div>
              <div class="publisher bt-1 border-light">
                <img class="avatar avatar-xs" src="" alt="...">
                   <input ref='messageInput' class='publisher-input' type='text' placeholder='message' v-model="newMessage" @keyup.enter="sendMessage">
                    <button @click="sendMessage">Send</button>
                <span class="publisher-btn file-group">
                  <i class="fa fa-paperclip file-browser"></i>
                  <input type="file">
                </span>
                <a class="publisher-btn" href="#" data-abc="true"><i class="fa fa-smile"></i></a>
                <a class="publisher-btn text-info" href="#" data-abc="true"><i class="fa fa-paper-plane"></i></a>
              </div>
             </div>
          </div>
          </div>
          </div>
          </div>
`,
});
}

