export default function albumApp()  { return new Vue({
  el: "#albumApp",
  delimiters: ["!{", "}"],
  data: {
    currentAlbumId: null,
    albums: [],
    photos: [],
    currentUser: {
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      profile_pic: null,
      isViewing: false,
    },
    viewingUser:{      
        username: "",
      email: "",
      first_name: "",
      last_name: "",
      profile_pic: null,
      isViewing: false
      },
    newPhoto: {
      image: null,
      caption: "",
      album: null, // We will set this dynamically based on the album we are adding to
    },
    newAlbum: {
      title: "",
      description: "",
      id: "",
    },
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      this.newPhoto.image = file;
    },

    showPhotos(albumId) {
      this.currentAlbumId = albumId;
    },
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
  mounted() {
    let csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");

    axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
    this.fetchCurrentUser().then(() => {
        console.log(this.currentUser)
      this.fetchAlbums();
    });
  },
  template: `
     <div class='row'> 
    <h2 class="mb-4">!{currentUser.username}'s Albums</h2>
    
    <div v-if='currentUser.isViewing === false'> 
        <h2>Create a New Album</h2>
        <form @submit.prevent='createAlbum' id="createAlbumForm">
            <input type="text" v-model="newAlbum.title" name="title" placeholder="Album Title">
            <input type="textfield" v-model="newAlbum.description" name="description" placeholder="Description">
            <button class="btn btn-primary" type='submit'>Create Album</button>
        </form>
    </div>


<div class="row" v-for="album in albums">
    <div class="album">
        <div class="row">
            <h3>!{album.title}
            <button v-if='currentUser.isViewing === false' :data-album-id="album.id" @click="deleteAlbum" class="btn btn-warning btn-sm">X</button>
            </h3>
            <p>Description: !{album.description}</p>
        
            <form v-if='currentUser.isViewing === false' @submit.prevent="uploadPhoto">
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
    `,
});
}

            
            
   

