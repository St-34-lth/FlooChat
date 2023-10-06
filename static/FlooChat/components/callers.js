// #my code begins here

const callers = {
  async deletePost(postId, posterId) {
    try {
      let res = await axios.delete(`/api/post/${posterId}/?post_id=${postId}`);
      return res;
    } catch (error) {
      console.error(error);
    }
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
  async createPost(postContent, posterId, postImage) {
    try {
      //maybe check for validity of the url
      //   console.log(postImage)
      if (postImage != undefined) {
        let formData = new FormData();
        formData.append("image", postImage);
        formData.append("caption", "");
        formData.append("content", postContent);
        return await axios.post(`/api/post/${posterId}/`, formData);
      }
      return await axios.post(`/api/post/${posterId}/`, {
        content: postContent,
      });
    } catch (error) {
      console.error(error);
    }
  },
  async fetchPosts(posterId) {
    try {
            let res = await axios.get(`/api/posts/${posterId}/`);
            return res.data 
    } catch (error) {
        console.log(error )
    }
  
  },
  async updatePost(postId, postContent, posterId) {
    try {
      let res = await axios.put(`/api/post/${posterId}/?post_id=${postId}`, {
        content: postContent,
      });
      return res;
    } catch (error) {
      console.error(error);
    }
  },

  async createComment(commentContent) {
    try {
      let res = await axios.post(
        `/api/posts/${commentContent.postId}/comments/`,
        { content: commentContent.content }
      );
    } catch (error) {
      console.log(error);
    }
  },
  async deleteComment(commentId, postId) {
    try {
      let res = await axios
        .delete(`/api/posts/${postId}/comments/?comment_id=${commentId}`)
        .then(() => {
          this.fetchPostComments();
        });
      console.log(Res);
    } catch (error) {
      console.log(error);
    }
  },

  async uploadPhoto(albumId,newPhoto) {
    try {
        const formData= new FormData()
        formData.append("image",newPhoto.image)
        formData.append("caption",newPhoto.caption)
        formData.append("album",albumId)
        
        
      let response = await axios.post(
        `/api/photo/${albumId}/upload/`,
        formData
      );
     
        return response.data
    } catch (error) {
      console.error("Error uploading the photo:", error);
    }
  },

  async sendFriendRequest(sender, receiver) {
    try {
      let res = await axios.post("/api/friend-request/create/", {
        sender: sender,
        receiver: receiver,
      });
      return res;
    } catch (error) {
      if (
        error.response &&
        error.response.data.non_field_errors &&
        error.response.data.non_field_errors[0] == "Already friends"
      ) {
        window.alert("Already friends");
      }
    }
  },
  async updateFriendRequest(requestId, status) {
    try {
      let res = await axios.put(`/api/friend-request/${requestId}/`, {
        status: status,
      });
      return res;
    } catch (error) {
      console.log(error);
    }
  },
  async fetchFriendRequests(currentUser) {
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
        // console.log(this.friendsList);
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  },
  async deleteAlbum(albumId) {
    // const albumId = event.currentTarget.getAttribute("data-album-id");
    try {
      let res = await axios.delete(
        `/api/album/${encodeURIComponent(albumId)}/`
      );
      return res.data;
    } catch (error) {
      console.error("Error deleting album:", error);
    }
  },
  async fetchAlbums(userId) {
    try {
      let res = await axios.get(`/api/albums/${userId}/`);
      if (res.status == 200) {
        return res.data;
        console.log(res.data);
      }
    } catch (error) {
      console.error("Error fetching albums:", error);
    }
  },
  async createAlbum(userId, albumData) {
    try {
      let response = await axios.post(
        `/api/album/${userId}/create/`,
        albumData
      );
      return response;
      // Handle the response, e.g., adding the new album to a list of albums:
    } catch (error) {
      console.error("Error creating the album:", error);
    }
  },

  getIdfromURL() {
    const url = new URL(document.location.href);
    //sanitise here
    const userId = url.pathname.split("/").at(2);
    return userId;
  },
};

export { callers };
