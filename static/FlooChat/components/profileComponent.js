// #my code begins here

export default function profileApp() {
  return new Vue({
    el: "#profileApp",
    delimiters: ["!{", "}"],
    data: {
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
      },
      postData: [],
      friendsList: [],
      friendRequests: [],
      albums: [],
      logoutUrl: "/logout/",
      urlId: "",
    },
    methods: {
      getIdfromURL() {
        const url = new URL(document.location.href);
        //sanitise here
        const userId = url.pathname.split("/").at(2);
        return userId;
      },
      async refreshFeed() {
        this.postData = [];
        this.fetchHomeState().then(() => {
          this.fetchPostComments();
        });
      },
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

      async fetchFriendRequests() {
        try {
          if (this.currentUser.isViewing == false) {
            let res = await axios.get(`/api/friend-request/`);
            let data = Object.values(res.data);

            this.friendRequests = Object.values(data);
          }
        } catch (error) {
          console.error("Error fetching friend requests:", error);
        }
      },
      async fetchFriendsList() {
        try {
          if (this.currentUser.isViewing == false) {
            let res = await axios.get("/api/friends/");
            this.friendsList = [];
            for (let friendship of res.data) {
              if (friendship.user_1.id == this.currentUser.id) {
                this.friendsList.push(friendship.user_2);
              } else {
                this.friendsList.push(friendship.user_1);
              }
            }
            console.log(this.friendsList);
          }
        } catch (error) {
          console.error("Error fetching friend requests:", error);
        }
      },
      async fetchHomeState() {
        try {
          let homePosts;
          if (this.currentUser.isViewing == false) {
            homePosts = await axios.get(`/api/posts/${this.currentUser.id}/`);
          } else {
            homePosts = await axios.get(`/api/posts/${this.viewingUser.id}/`);
          }
          this.postData = [];
          console.log(homePosts.data);
          for (let post of homePosts.data) {
            post.comments = [];

            this.postData.push(post);
          }
        } catch (error) {
          console.log(error);
        }
      },
      async fetchPostComments() {
        try {
          for (let post of this.postData) {
            let res = await axios.get(`/api/posts/${post.id}/comments/`)

            post.comments = res.data;
          }
        } catch (error) {
          console.log(error);
        }
      },

      async fetchData() {
        try {
          await this.fetchCurrentUser();

          await this.fetchFriendRequests();

          await this.fetchFriendsList();

          await this.fetchHomeState();

          await this.fetchPostComments();
          await this.fetchAlbums(this.currentUser.id).then((data) => {
            this.albums = data;
          });
        } catch (error) {
          console.log(error);
        }
      },
      async handleFriendRequestResponse(friendRequestId, status) {
        try {
          let res = await this.updateFriendRequest(friendRequestId, status);

          await this.fetchFriendRequests();
          await this.fetchFriendsList();
        } catch (error) {
          console.log(error);
        }
      },
      async handleCommentCreation(comment) {
        console.log(comment);

        await this.createComment(comment);
        await this.fetchPostComments();
      },
      async handleCommentDeletion(commentId, postId) {
        await this.deleteComment(commentId, postId);
        await this.fetchPostComments();
    
      },
      async handleDeletePhoto(post) {},
      async handlePostCreation(postContent, posterId, postImage) {
        if (postImage != "") {
          console.log(postImage);
          let post = await this.createPost(postContent, posterId, postImage);
          console.log(post);
        }

        this.fetchData();
      },
      async handleFriendRequestSent(sender, receiver) {
        try {
          let res = await this.sendFriendRequest(sender, receiver).then(() => {
            window.alert("friend request sent");
          });
        } catch (error) {
          console.log(error);
        }
      },
      async handleCreateAlbum(albumData) {
        this.createAlbum(this.currentUser.id, albumData).then(async () => {
          this.albums = await this.fetchAlbums();
        });
      },
      async handleDeleteAlbum(albumId) {
        this.deleteAlbum(albumId).then(async () => {
          this.albums = await this.fetchAlbums();
        });
      },
      async handleUploadPhoto(albumId, newPhoto) {
        this.uploadPhoto(albumId, newPhoto);
      },
      async handlePostDeletion(postId, posterId) {

        this.deletePost(postId, posterId).then(async () => {
        this.fetchData()

        });
      },
    },
    created() {
      let csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
      this.fetchData();
      console.log(this.albums);
    },
    mounted() {},
    template: `
        <div class="container mt-5">
        
            <profile-display :onFriendRequestSent='handleFriendRequestSent' :currentUser='currentUser' :viewingUser='viewingUser' ></profile-display>
            
            <div v-if='currentUser.isViewing == false' class='row'>
            <friends-display :friendsList='friendsList' :friendRequests='friendRequests' :onFriendRequestResponse="handleFriendRequestResponse"></friends-display>
          <albums-list v-if='currentUser.id!=""' :currentUser="currentUser" :onCreateAlbum="handleCreateAlbum" :onDeleteAlbum="handleDeleteAlbum" :onUploadPhoto="handleUploadPhoto" :albums='albums' ></albums-list> 
            </div>
            <div class='row'>
            <div v-if='currentUser.isViewing==false'>
            <create-post v-if='currentUser.id != "" ' :currentUser='currentUser' :onCreatePost='handlePostCreation'  ></create-post>
            </div>
                
            <posts-display  v-if='currentUser.id!=""' :currentUser='currentUser' :onDeleteComment='handleCommentDeletion' :postData='postData' :onCreateComment='handleCommentCreation' :onDeletePhoto='handleDeletePhoto' :onPostDelete="handlePostDeletion" ></posts-display>'
            </div>
          </div>`,
  });
}
