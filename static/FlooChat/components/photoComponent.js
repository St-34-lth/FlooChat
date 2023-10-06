// code begins here 
export default function photoApp() { return new Vue({
  el: "#photoApp",
  delimiters: ["!{", "}"],
  data: {
    photos: [],
    album_id: null, // This assumes you can get the album's ID somehow to fetch the photos. It can be passed in through the template or fetched from the URL.
  },
  mounted() {
    // Assuming you pass the album_id somehow (e.g., in a meta tag, as a global variable, or derived from the URL)
    let csrfToken = document
      .querySelector('meta[name="csrf-token"]')
      .getAttribute("content");

    axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
    this.fetchPhotos();
  },
  methods: {
    fetchPhotos() {
      if (!this.album_id) {
        console.error("Album ID is missing. Cannot fetch photos.");
        return;
      }

      // Fetching photos of the specified album from the API
      axios
        .get(`/api/albums/${this.album_id}/photos/`)
        .then((response) => {
          this.photos = response.data;
        })
        .catch((error) => {
          console.error("Error fetching photos: ", error);
        });
    },
    async fetchCurrentUser() {
      try {
        let res = await axios.get("/api/current-user/");
        this.user = res.data; // Updating the user object with the response data
        console.log(res);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          console.error("Error: Unauthorized access."); // Logging error message to console
        }
      }
    },
  },
  template: `    
  <div> 
  <h2>Photos in Album: !{ album_name } </h2> 
    <div class="row">
        <div v-for="photo in photos" class="col-md-4 mb-4">
            <div class="photo-card">
                <img :src="photo.image.url" :alt="photo.caption" class="img-thumbnail">
                <p class="mt-2"> !{ photo.caption }</p>
     
            </div>
        </div>
    </div>
    <a href="/albums/" class="btn btn-link">Back to Albums</a>    
    </div>`,
});
}
