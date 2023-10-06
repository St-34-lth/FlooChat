export default function feedApp() {
  return new Vue({
    el: "#feedApp",
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
      postData: [],
      friendsList: [],
    },
    watch: {
      postData(newVal, oldVal) {},
    },
    methods: {
      async refreshFeed() {
        this.postData = [];
        this.fetchUserFeed().then(() => {
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

      async fetchFriendsList() {
        try {
          let res = await axios.get("/api/friends/");
          this.friendsList = [];
          for (let friendship of res.data) {
            if (friendship.user_1.id == this.currentUser.id) {
              this.friendsList.push(friendship.user_2);
            } else {
              this.friendsList.push(friendship.user_1);
            }
          }
        } catch (error) {
          console.error("Error fetching friend requests:", error);
        }
      },
      async fetchUserFeed() {
        //maybe paginate this
        for (let friend of this.friendsList) {
          let friendPosts = await axios.get(`/api/posts/${friend.id}/`);

          for (let post of friendPosts.data) {
            post.comments = [];
            this.postData.push(post);
          }
        }

        let userPosts = await axios.get(`/api/posts/${this.currentUser.id}/`);
        for (let post of userPosts.data) {
          post.comments = [];
          this.postData.push(post);
        }
      },
      async fetchPostComments() {
        try {
          for (let post of this.postData) {
            let res = await axios.get(`/api/posts/${post.id}/comments/`);

            post.comments = res.data;
          }
        } catch (error) {
          console.log(error);
        }
      },
      async handlePostCreation(postContent, posterId, postImage) {
        if (postImage != "") {
          console.log(postImage);
          let post = await this.createPost(postContent, posterId, postImage);
          console.log(post);
        }

        this.refreshFeed();
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

        this.refreshFeed();
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
          this.refreshFeed();
        });
      },
    },
    mounted() {
      let csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        .getAttribute("content");
      axios.defaults.withCredentials = true;
      axios.defaults.headers.common["X-CSRFToken"] = csrfToken;

      this.fetchCurrentUser().then(() => {
        this.fetchFriendsList().then(() => {
          this.fetchUserFeed().then(() => {
            this.fetchPostComments();
          });
        });
      });
    },

    template: `
<!-- Main Content Section -->
<div> 
<div>
<create-post :createPost='createPost' :currentUser='currentUser' :onCreatePost="handlePostCreation"></create-post>
</div>

    <!-- Feed Section -->
 <posts-display  v-if='currentUser.id!=""' :currentUser='currentUser' :onDeleteComment='handleCommentDeletion' :postData='postData' :onCreateComment='handleCommentCreation' :onDeletePhoto='handleDeletePhoto' :onPostDelete="handlePostDeletion" ></posts-display>'

  

      <!--  Topics -->
      <section class="mb-4 p-4 border rounded bg-light">
        <h2 class="h6 mb-3">Trending Topics</h2>
        <ul class="list-unstyled">
          <li class="mb-1">#Topic1</li>
          <li class="mb-1">#Topic2</li>
          <li class="mb-1">#Topic3</li>
          <!-- Additional topics here -->
        </ul>
      </section>
      <!-- Friend Suggestions -->
      <section class="p-4 border rounded bg-light">
        <h2 class="h6 mb-3">Friend Suggestions</h2>
        <ul class="list-unstyled">
          <li class="mb-2 d-flex align-items-center">
            <img src="path/to/friend1_pic.jpg" alt="Friend 1 Picture" class="rounded-circle mr-2" style="width: 40px; height: 40px;">
            <span class="flex-grow-1">Friend 1 Name</span>
            <button class="btn btn-sm btn-primary">Add</button>
          </li>
        
        </ul>
      </section>
    </aside>
</div>
    `,
  });
}
