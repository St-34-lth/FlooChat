// #my code begins here 
const createPost = Vue.component("create-post", {
  props: ["currentUser" ,'onCreatePost' ],
  delimiters: ["!{", "}"],
  data() {
    return {
      localPostContent: "",
      localPosterInfo: this.currentUser,
      selectedImage: null,
      imagePreview: null
    };
  },
  template: `
<div class="card" style="background-color: #f8f9fa; border-radius: 10px; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);">
    <div class="card-body">
        <textarea class="form-control" v-model="localPostContent" placeholder="What's on your mind?" rows="4" style="border-radius: 10px;"></textarea>
        <button class="btn btn-primary mt-2" style="background-color: #563d7c; border: none;" @click="onCreatePost(localPostContent,currentUser.id,selectedImage)">Post</button>
    
        <form>
            <input type="file" name="image" @change="onFileChange" style="display: none" ref="fileInput">
            <button type="button" @click="triggerFileInput" class="btn btn-primary mt-2" style="background-color: #6f42c1; border: none;">Upload Photo</button>
            <input type="hidden" name="album" value="6">
            <div v-if="imagePreview" class="image-preview mt-2">
                <img :src="imagePreview" alt="Image Preview" style="max-width: 100%; border-radius: 10px;">
            </div>
        </form>
    </div>
</div>
  `,
  methods: {

    triggerFileInput() {
      this.$refs.fileInput.click();
    },
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedImage = file;
        this.imagePreview = URL.createObjectURL(file);
      }
    }
  },
  });

const commentPost = Vue.component("comment-section", {
  props: [
    "postId",
    "comments",
    "onCreateComment",
    "currentUser",
    "onDeleteComment",
  ],
  delimiters: ["!{", "}"],
  data() {
    return {
      newComment: "",
    };
  },
  template: `
<div class="comment-section mt-2">
  <div v-for="comment in comments" :key="comment.id" class="comment mb-2">
    <div class="comment-text">
     <h5>!{ comment.user.username }</h5>
      <p>!{ comment.content }</p><br>
     
      <small class="text-muted">!{ new Date(comment.created_at).toLocaleString() }</small>
      <div v-if='currentUser.isViewing == false'> 
       <button @click='onDeleteComment(comment.id,postId)' class='btn btn-secondary' type='button'>X</button>
    </div>

    </div>

  </div>
  <div class="input-group">
    <input v-model="newComment" type="text" class="form-control" placeholder="Add a comment...">
    <button @click="addComment" class="btn btn-primary" type="button">Comment</button>
  </div>
</div>
`,
  methods: {
    addComment() {
      if (this.newComment.trim() !== "") {
        let comment = {
          content: this.newComment,
          postId: this.postId,
        };
        this.newComment = "";
        this.onCreateComment(comment)
          .then(() => {
            this.newComment = ""; // Reset the input field
          })
          .catch((error) => {
            console.error("Error adding comment:", error);
          });
      }
    },
  },
});

const friendsDisplay = Vue.component("friends-display", {
  props: ["friendsList", "friendRequests", "onFriendRequestResponse"],
  delimiters: ["!{", "}"],
  data() {
    return {
      isListVisible: false,
      localFriendsList: [],
      localFriendRequests: [],
      friendIncrement: 10, // Adjust this value as necessary
    };
  },
  mounted() {
    let csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");
    axios.defaults.withCredentials = true;
    axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
    this.$el.addEventListener("scroll", this.handleScroll);
  },
  computed: {
    friendsToShow() {
      return this.localFriendsList.slice(0, this.friendIncrement);
    },
  },
  methods: {
    handleScroll() {
      let container = this.$el;
      if (
        container.scrollTop + container.clientHeight >=
        container.scrollHeight
      ) {
        this.friendIncrement += 10; // Load 10 more friends each time
      }
    },
    updateFriendList(results) {
      this.localFriendList = results;
    },
    updateRequestList(results) {
      this.localFriendRequests = results;
    },
    async handleFriendRequest(id, status) {
      try {
        this.onFriendRequestResponse(id, status);
      } catch (error) {
        console.log(error);
      }
    },
  },

  watch: {
    friendsList(newVal, oldVal) {
      this.localFriendsList = newVal;
      if (this.localFriendsList != undefined) {
        this.isListVisible = this.localFriendsList.length > 0;
      }
    },

    friendRequests(newVal, oldVal) {
      this.localFriendRequests = newVal;
    },
    immediate: true,
  },

  template: `
        <div class='row mb-5'>
    <div class='col-6'>
        <h4 class="text-primary mb-4">Friends</h4>
        <div id='friendsContainer' v-if="isListVisible">
            <ul class="list-group">
                <li v-for="(friend, index) in friendsToShow" :key="friend.id" class="list-group-item">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>  
                        <div class='row'>  <img :src="friend.profile_pic"></div>
                        <div class='row'>   <a :href="'/profile/'+friend.id+'/'" class="text-dark font-weight-bold">
                                !{ friend.username }
                            </a> </div>
                     
                       
                          
                            <div>!{ friend.first_name } !{ friend.last_name }</div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>

    <div class='col-6'>
        <h4 class="text-primary mb-4">Friend Requests</h4>
        <ul class="list-group">
            <li v-for="(request, index) in localFriendRequests" :key="index" class="list-group-item">
                <div>
                    <strong>Username:</strong> !{ request?.receiver?.username }<br>
                    <!--- Uncomment the following line to display profile pictures once you have the URLs ready -->
                    <img :src="request?.receiver?.profile_pic" :alt="request?.receiver?.username" class="img-thumbnail mb-2"><br>
                    <strong>Status:</strong> !{ request?.status }
                </div>
                <div class='row mt-2'>
                    <div class="col">
                        <button @click='onFriendRequestResponse(request.id,"accepted")' class='btn btn-secondary btn-sm'>Accept</button>
                    </div>
                    <div class="col">
                        <button @click='onFriendRequestResponse(request.id,"rejected")' class='btn btn-danger btn-sm'>Decline</button>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</div>
`,
});

const postDisplay = Vue.component("posts-display", {
  props: [
    "postData",
    "currentUser",
    "onCreateComment",
    "onDeleteComment",
    "onDeletePhoto",
    "onPostDelete",
  ],
  delimiters: ["!{", "}"],
  data() {
    return { localPostData: this.postData, localPostPhotos: [] };
  },
  watch: {
    postData(newVal, oldVal) {
      this.localPostData = newVal;
      console.log(this.localPostData);
      console.log(this.currentUser);

      for (let i = 0; i < newVal.length; i++) {
        let post = newVal[i];

        if (post.photo != null) {
          this.localPostPhotos.push(post.photo);
        }
      }
    },
  },

  template: `   
<section class="col-md-8">
    <div v-for="post in localPostData" :key="post.id">
        <!-- Individual Post -->
        <article class="mb-4 p-4 border rounded bg-light">
            <header class="d-flex align-items-center mb-2">
                <img :src="post.user.profile_pic" alt="Profile Picture" class="rounded-circle mr-2" style="width: 50px; height: 50px;">
                <div>
                    <h2 class="h5 mb-0">
                        !{ post.user.username }
                        <button v-if='currentUser.id==post.user.id' @click='onPostDelete(post.id,currentUser.id)' class='btn btn-alert' type='button'> Delete </button>
                    </h2>
                    <time :datetime="post.created_at" class="small text-muted">!{ formatDate(post.created_at) }</time>
                </div>
            </header>
            
          <div v-if='currentUser.id==post.user.id'>
                <div class="post-content mb-2" v-if="post.isEditable">
                    <textarea v-model="post.content" class="form-control"></textarea>
                    <img v-if="post.photo" :src='post.photo.image'>
                    <button @click="editPost(post.id)" class="btn btn-primary">Save</button>
                    <button @click="toggleEdit(post)" class="btn btn-secondary">Cancel</button>
                  
                </div>
                <div class="post-content mb-2" v-else>
                    <p @click="toggleEdit(post)">!{ post.content }</p>
                   
                </div>
                    <div v-if='post.photo'>
                        <img  width='200px;' :src='post.photo.image'>
                        
                    </div>
        </div>

        <div v-else >
                <div class="post-content mb-2">
                    <p>!{ post.content }</p>
                     <div v-if='post.photo'>
                        <img  width='200px;' :src='post.photo.image'>
                        
                    </div>
                        <div v-if='post.photo'>
                        <img  width='200px;' :src='post.photo.image'>
                        
                    </div>
                </div>
            </div>
            
            <footer class="post-footer d-flex justify-content-between">
       
                <comment-section :onDeleteComment='onDeleteComment' :currentUser='currentUser' :postId="post.id" :comments="post.comments.data" :onCreateComment='onCreateComment'></comment-section>
            </footer>
        </article>
    </div>
</section>
`,
  mounted() {},
  methods: {
    formatDate(dateString) {
      let date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hours: "numeric",
        minutes: "numeric",
      });
    },

    getPhotoId(post) {
      return post.photo ? post.photo.id : "no photo id";
    },
    toggleEdit(post) {
      this.$set(post, "isEditable", !post.isEditable);
    },

    updateContent(event, post) {
      post.content = event.target.innerText;
    },

    async editPost(postId) {
      const post = this.localPostData.find((post) => post.id === postId);
      if (post) {
        try {
          await this.updatePost(postId, post.content).then(() => {
            this.toggleEdit(post);
          });
        } catch (error) {
          console.error("Failed to edit post", error);
        }
      }
    },
  },
});

const profileDisplay = Vue.component("profile-display", {
  props: [
    "defaultProfilePic",
    "albumUrl",
    "friendsList",
    "friendRequests",
    "logoutUrl",
    "onFriendRequestSent",
  ],

  delimiters: ["!{", "}"],
  computed: {
    localCurrentUser() {
      return this.$root.currentUser;
    },
    localViewingUser() {
      return this.$root.viewingUser;
    },
  },

  methods: {
    async sendFriendRequest() {
      this.$root.sendFriendRequest();
    },
  },
  template: `
<div class="container mt-5">
  <h2 class="mb-4 text-primary">User Profile</h2>
  <div class="row">
    
    <div v-if='localCurrentUser.isViewing==false' class="col-md-8">
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4>Profile Picture</h4>
            </div>
            <div class="card-body text-center">
              <img :src="localCurrentUser.profile_pic" :alt="localCurrentUser.username" class="img-thumbnail rounded-circle">
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h4>Details</h4>
            </div>
            <div class="card-body">
              <p><strong>Username:</strong> <span class="text-primary">!{localCurrentUser.username}</span></p>
              <p><strong>Email:</strong> <span class="text-info">!{localCurrentUser.email}</span></p>
              <p><strong>First Name:</strong> <span class="text-success">!{localCurrentUser.first_name}</span></p>
              <p><strong>Last Name:</strong> <span class="text-warning">!{localCurrentUser.last_name}</span></p>
              
            </div>
            <div class='card-body'>
            
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="col-md-8">
      <div class="row">
        <div class="col-md-4">
          <div class="card">
            <div class="card-header bg-primary text-white">
              <h4>Profile Picture</h4>
            </div>
            <div class="card-body text-center">
              <img :src="localViewingUser.profile_pic" :alt="localViewingUser.username" class="img-thumbnail rounded-circle">
            </div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="card">
            <div class="card-header bg-secondary text-white">
              <h4>Details</h4>
            </div>
            <div class="card-body">
              <p><strong>Username:</strong> <span class="text-primary">!{localViewingUser.username}</span></p>
              <p><strong>Email:</strong> <span class="text-info">!{localViewingUser.email}</span></p>
              <p><strong>First Name:</strong> <span class="text-success">!{localViewingUser.first_name}</span></p>
              <p><strong>Last Name:</strong> <span class="text-warning">!{localViewingUser.last_name}</span></p>
            </div>
                 <div class='card-body'>
                
            </div>
          </div>
          <div class="card mt-3">
            <div class="card-body">
              <button @click='onFriendRequestSent(localCurrentUser.id,localViewingUser.id)' class='btn btn-primary'>Send Friend Request</button>
             
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
`,
});

const photosList = Vue.component("photos-list", {
  props: ["albumId"],
  delimiters: ["!{", "}"],
  data() {
    return {
      photos: [],
      currentPage: 1,
      itemsPerPage: 1,
      showPhotos: false,
    };
  },
  computed: {
    paginatedPhotos() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = this.currentPage * this.itemsPerPage;
      return this.photos.slice(start, end);
    },
  },
  watch: {
    albumId: function (newId, oldId) {
      this.fetchPhotos();
    },
  },
  methods: {
    async fetchPhotos() {
      if (!this.albumId) return;
      try {
        const response = await axios.get(`/api/album/${this.albumId}/`);
        this.photos = response.data.photos;
        console.log(this.photos);
      } catch (error) {
        console.error("Error fetching photos:", error);
      }
    },
    toggleShowPhotos() {
      this.showPhotos = !this.showPhotos;
      if (this.showPhotos == true) {
        this.fetchPhotos();
      }
    },
    nextPage() {
      if (this.currentPage * this.itemsPerPage < this.photos.length) {
        this.currentPage++;
      }
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
      }
    },
  },
  mounted() {
    let csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");

    axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
  },
  template: `
    <div>
      <h3>Photos</h3>
  
        
      <button @click="toggleShowPhotos">
        !{ showPhotos ? 'Hide Photos' : 'Show Photos' }
      </button>
      <div class='card' v-if="showPhotos">
        <div  v-for="photo in paginatedPhotos">
          
          
          <img :src="photo.image" :alt="photo.caption" class="img-thumbnail"/>
              <div class='card-body'>
    <p>!{photo.caption}</p>
    </div>
        </div>

        <button @click="prevPage">Previous</button>
        <button @click="nextPage">Next</button>
      </div>
    </div>
  `,
});

const albumsList = Vue.component("albums-list", {
  props: [
    "currentUser",
    "onCreateAlbum",
    "onUploadPhoto",
    "onDeleteAlbum",
    "albums",
  ],
  delimiters: ["!{", "}"],
  data() {
    return {
      newAlbum: {
        title: "",
        description: "",
        id: "",
      },
      newPhoto: {
        image: null,
        caption: "",
        album: null,
      },
    };
  },

  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      this.newPhoto.image = file;
    },
    createAlbum(newAlbum) {
      if (newAlbum.title.trim() !== "" && newAlbum.description.trim() !== "") {
        this.onCreateAlbum(newAlbum)
          .then(() => {
            // Reset the album form
            this.newAlbum.title = "";
            this.newAlbum.description = "";
          })
          .catch((error) => {
            console.error("Error creating album:", error);
          });
      }
    },
    photoUpload(albumId, newPhoto) {
      try {
        if (newPhoto.image !== null && newPhoto.caption.trim() !== "") {
          this.onUploadPhoto(albumId, newPhoto);
        }
      } catch (error) {}
    },
    deleteAlbum(albumId) {
      this.onDeleteAlbum(albumId).catch((error) => {
        console.error("Error deleting album:", error);
      });
    },
  },
  mounted() {
    this.albums = this.$root.albums;
  },
  template: `
     <div class='row'> 
    <h2 class="mb-4">!{currentUser.username}'s Albums</h2>
    
    <div v-if='currentUser.isViewing === false'> 
        <h2>Create a New Album</h2>
        <form @submit.prevent='onCreateAlbum(newAlbum)' id="createAlbumForm">
            <input type="text" v-model="newAlbum.title" name="title" placeholder="Album Title">
            <input type="textfield" v-model="newAlbum.description" name="description" placeholder="Description">
            <button class="btn btn-primary" type='submit'>Create Album</button>
        </form>

<div class="row" v-for="album in albums">
    <div class="album">
        <div class="row">
            <h3>!{album.title}
            <button v-if='currentUser.isViewing === false' :data-album-id="album.id" @click="onDeleteAlbum(album.id)" class="btn btn-warning btn-sm">X</button>
            </h3>
            <p>Description: !{album.description}</p>
        
            <form v-if='currentUser.isViewing === false' @submit.prevent="photoUpload(album.id,newPhoto)">
                <input type="file" name="image" v-on:change="onFileChange">
                <input type="hidden" :value="album.id" name="album">
                <input type="text" name="caption" v-model="newPhoto.caption" placeholder="Add a caption...">
                <button type="submit">Upload Photo</button>
            </form>
        
            <photos-list :album-id="album.id"></photos-list>
    </div>


        </div>
    </div>
</div>


</div>
    `,
});


export {
  commentPost,
  createPost,
  profileDisplay,
  friendsDisplay,
  postDisplay,
  photosList,
    albumsList
};