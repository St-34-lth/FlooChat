import searchApp from "http://127.0.0.1:8000/static/FlooChat/components/searchComponent.js";
import {mount} from "@vue/test-utils"
describe("searchApp Vue Instance", function () {
  let app;

  beforeAll(function () {
      document.body.innerHTML += `
      <div id="searchApp"></div>
    `;
    app = searchApp();
  });

  it("should initialize with correct data properties", function () {
    expect(app.searchInput).toBe("");
  });

  it("should have a working onSearch method", function (done) {
    spyOn(console, "log");
    let inputElement = document.querySelector("#searchBar input");

    inputElement.value = "Test Room";
    let inputEvent = new Event("input");
    inputElement.dispatchEvent(inputEvent);
    let enterEvent = new KeyboardEvent('keyup',{key:'Enter'})
    inputElement.dispatchEvent(enterEvent)
    expect(app.searchInput).toBe("Test Room");

    // let submitEvent = new Event("submit");
    // inputElement.dispatchEvent(submitEvent);

    Vue.nextTick()
      .then(function () {
        expect(console.log).toHaveBeenCalledWith("Test Room");
        done();
      })
      .catch(done.fail);
  });
});


import profileApp from "http://127.0.0.1:8000/static/FlooChat/components/profileComponent.js";

describe("profileApp Vue Instance", function () {
  let app;
let wrapper;
  beforeAll(function () {
    document.body.innerHTML += `
      <div id="profileApp"></div>

    `;
 let data = Array.from({ length: 20 }, (_, i) => ({
   user_1: {
     id: i,
     username: `User1_Friend${i}`,
     first_name: `User1_FirstName${i}`,
     last_name: `User1_LastName${i}`,
   },
   user_2: {
     id: i + 20, // To make user_2 IDs different from user_1
     username: `User2_Friend${i}`,
     first_name: `User2_FirstName${i}`,
     last_name: `User2_LastName${i}`,
   },
 }));

     spyOn(axios, "get").and.returnValue(Promise.resolve({ data: data }));
    //  spyOn(axios, "post").and.returnValue(Promise.resolve({ data: data }));
       
    app = profileApp();

  });
  




  it("should load more friends on scroll", async () => {
    expect(app.friendsList.localFriendList.length).toBe(20); // Initially we have 20 friends
    expect(app.friendsToShow.length).toBe(10); // Only 10 should be visible initially

    // Simulate a scroll event to trigger the lazy loading
    app.find("#friendsContainer").trigger("scroll");

    await app.$nextTick(); // Wait for the DOM to update

    // expect(wrapper.vm.$data.friendsToShow.length).toBe(20); // Now all 20 friends should be visible
  });

it("should display a list of friends", function () {
  component.localFriendList = app.friendsList;
  component.$nextTick(() => {
    let friendElements = component.$el.querySelectorAll(".col-6 ul li a");
    expect(friendElements.length).toBe(2);
    expect(friendElements[0].textContent.trim()).toBe("friend1");
    expect(friendElements[1].textContent.trim()).toBe("friend2");
  });
});

  it("should initialize with correct data properties", function () {
    expect(app.user).toEqual({
      username: "",
      email: "",
      first_name: "",
      last_name: "",
      profile_pic: null,
    });
    expect(app.defaultProfilePic).toBe(
      "/static/FlooChat/images/default_profile_pic.jpeg"
    );
    expect(app.albumUrl).toBe("/albums/");
    expect(app.logoutUrl).toBe("/logout/");
  });

  it("should have a fetchCurrentUser method", function () {
    expect(typeof app.fetchCurrentUser).toBe("function");
  });

 it("should fetch current user data correctly", function (done) {
   spyOn(axios, "get").and.returnValue(
     Promise.resolve({ data: { user: { username: "testUser" } } })
   );
   spyOn(console, "error");

   app.fetchCurrentUser().then(() => {
     expect(app.user.username).toBe("testUser");
     done();
   });
 });

it("should handle 401 Unauthorized errors correctly", async () => {
  spyOn(console, "error");

  try {
    await app.fetchCurrentUser();
  } catch (error) {
    // If there are other errors that might be thrown, you can still catch and assess them here
  }

  expect(console.error).toHaveBeenCalledWith("Error: Unauthorized access.");
});

});


