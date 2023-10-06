 export default function  headerApp()  { return new Vue({
   el: "#headerApp",
   delimiters: ["!{", "}"],
   data: {
     searchInput: "",
     searchResults: [],
   },
   methods: {
     onSearch(e) {
       console.log(e.target.value);
       this.searchInput = e.target.value;

       this.fetchResults(this.searchInput).then((data) => {});
     },
     async fetchResults(query) {
       try {
         let res = await axios.get(`/api/search/${query}/`);
         this.searchResults = res.data;
         this.$refs.resultList.updateResults(res.data); // Assuming that res.data contains the result data
         console.log(res);
       } catch (error) {
         console.error("Error fetching results:", error);
       }
     },
   },
   mounted() {
     let csrfToken = document
       .querySelector('meta[name="csrf-token"]')
       .getAttribute("content");
     axios.defaults.withCredentials = true;
     axios.defaults.headers.common["X-CSRFToken"] = csrfToken;
   },
   components: {
     resultList: Vue.component("result-list", {
       props: ["searchResults"],
       delimiters: ["!{", "}"],
       data() {
         return {
           isPanelVisible: false,
           localSearchResults: [],
           //    profileUrl:`/api/user/${this.$root.}/`
         };
       },
       methods: {
         updateResults(results) {
           this.localSearchResults = results;
         },
         selectUserProfile(user) {
           //    this.$root.setUserProfile(user);
         },
       },
       watch: {
         searchResults: {
           handler(newVal) {
             this.localSearchResults = newVal;
             this.isPanelVisible = newVal && newVal.length > 0;
           },
           immediate: true,
         },
       },
       template: `
        <div v-if="isPanelVisible" class="search-result-panel">
          <ul>
            <li v-for="(result, index) in localSearchResults" :key="index">
              
               <a :href="'/profile/' + result.id+'/'"> !{ result.first_name }</a>
              </a>
            </li>
          </ul>
        </div>
      `,
     }),
     navBar: Vue.component("nav-bar", {
       template: `
  <div>
    <nav class="navbar navbar-expand-lg navbar-light bg-light">
      <div class="container-fluid">
        <div class="dropdown me-auto">
          <a href="#" class="d-flex align-items-center link-body-emphasis text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            <svg class="bi me-2" width="40" height="32">
              <use xlink:href="#bootstrap"></use>
            </svg>
          </a>
          <ul class="navbar-nav">
            <!-- ... -->
          </ul>
          <ul class="dropdown-menu text-small shadow">
            <!-- ... -->
          </ul>
        </div>

        <div class="d-flex ms-auto">
          <div class="flex-shrink-0 dropdown">
            <a href="#" class="d-block link-body-emphasis text-decoration-none dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
              <!-- ... -->
            </a>
            <ul class="dropdown-menu text-small shadow">
              <!-- ... -->
            </ul>
          </div>
        </div>
      </div>
    </nav>
  </div>
`,
     }),
   },
   template: `

        <div>
        
        <nav-bar></nav-bar>
        <div id='searchBar' class="d-flex align-items-center">
         <form @submit.prevent="" class="w-100 me-3" role="search">
                <input @keyup.enter.prevent="onSearch" type="search" class="form-control" placeholder="Search..." aria-label="Search">
            
            </form>
            <resultList :searchResults="searchResults" ref="resultList"></resultList>

        </div>
        </div>
 `,
 }); 
} 
