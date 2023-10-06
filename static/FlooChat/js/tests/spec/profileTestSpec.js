// import profileApp  from "http://127.0.0.1:8000/static/FlooChat/components/profileComponent.js";

// describe("profileApp Vue Instance", function () {
//   var app;

//   beforeAll(function () {
//     document.body.innerHTML += `
//       <div id="profileApp"></div>
//       <meta name="csrf-token" content="test-token">
//     `;

//     app = profileApp();
//   });

//   it("should initialize with correct data properties", function () {
//     expect(app.user).toEqual({
//       username: "",
//       email: "",
//       first_name: "",
//       last_name: "",
//       profile_pic: null,
//     });
//     expect(app.defaultProfilePic).toBe(
//       "/static/FlooChat/images/default_profile_pic.jpeg"
//     );
//     expect(app.albumUrl).toBe("/albums/");
//     expect(app.logoutUrl).toBe("/logout/");
//   });

//   it("should have a fetchCurrentUser method", function () {
//     expect(typeof app.fetchCurrentUser).toBe("function");
//   });

//   it("should fetch current user data correctly", function (done) {
//     spyOn(axios, "get").and.returnValue(
//       Promise.resolve({ data: { username: "testUser" } })
//     );
//     spyOn(console, "error");

//     app.fetchCurrentUser().then(() => {
//       expect(app.user.username).toBe("testUser");
//       expect(console.error).not.toHaveBeenCalled();
//       done();
//     });
//   });

//   it("should handle errors correctly when fetching current user data fails", function (done) {
//     spyOn(axios, "get").and.returnValue(
//       Promise.reject(new Error("Fetch Error"))
//     );
//     spyOn(console, "error");

//     app.fetchCurrentUser().catch(() => {
//       expect(console.error).toHaveBeenCalledWith(
//         "Error fetching current user:",
//         new Error("Fetch Error")
//       );
//       done();
//     });
//   });
// });
