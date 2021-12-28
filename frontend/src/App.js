


import React, { useState } from "react";

const App = () => {
  const [band, setBand] = useState("");
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  // ! We are no longer using the "albums" state variable to access the current list of albums!
  // ! Instead we are using currentUser.albums
  // const [albums, setAlbums] = useState([]);

  // const [albumToBeUpdated, setAlbumToBeUpdated] = useState({});
  // Note: currentUser is an object with "username" property
  // Later we may add extra properties!
  const [currentUser, setCurrentUser] = useState({ _id: "", username: "", albums: [], token: "" });
  // Use these state variables to control the value of the login inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Function to change the state variable corresponding to a form input the user tried to change
  const changeData = (event) => {
    let newValue = event.target.value;

    switch (event.target.name) {
      case "band":
        setBand(newValue);
        break;
      case "title":
        setTitle(newValue);
        break;
      case "year":
        setYear(newValue);
        break;
      case "username":
        setUsername(newValue);
        break;
      case "password":
        setPassword(newValue);
        break;
      default:
        break;
    }
  };

  // const changeUpdateData = (event) => {
  //   setAlbumToBeUpdated({
  //     ...albumToBeUpdated,
  //     username: currentUser.username,
  //     [event.target.name]: event.target.value,
  //   });
  // };

  // ===============================================================

  // Function to handle submitting a new album to our server using a POST request
  const submitForm = (event) => {
    event.preventDefault();

    // Create new album object
    const newAlbum = {
      _id: currentUser._id,
      band: band,
      title: title,
      year: year
    };

    // "Translate" the object into a JSON string
    const jsonNewAlbum = JSON.stringify(newAlbum);

    // Set up the post request we will shortly make
    const settings = {
      method: "POST",
      body: jsonNewAlbum,
      headers: {
        "Content-Type": "application/json",
        // Pattern => Authorization: <type> <credentials>
        // "Authorization": "Bearer " + currentUser.token
      },
      // "credentials" - controls what the browser does with cookies
      // "include" means cookies will be included in both same- and cross-origin requests
      credentials: "include"
    };

    // Make a post request to our server, including the new data in req.body
    fetch("http://localhost:3001/albums", settings)
      .then(response => {
        if (response.ok) {
          return response.json();
          // If the request was not successful, throw an error and go to the "catch" block
        } else {
          // Throw an error with an appropriate message depending on the status code of the error received in the server response
          switch (response.status) {
            case 401:
              // throw new Error("Error: authorization error - please try again")
              return response.json().then(err => {
                throw new Error(err.message);
              })
            case 403:
              throw new Error("Error: validation error - please check the album details and try again");
            default:
              throw new Error("Error: server error - please try again");
          }
        }
      })
      // Receive the _id of the new album from the backend
      .then((data) => {
        // * Make a second fetch request to assign the new album to the current user's "albums" array
        // Define the body of the second fetch request
        // It will have 1 property - the _id of the album we just created in the "albums" collection
        const update = {
          albumId: data
        }

        // Turn the "update" object into a JSON string to send to the backend
        const jsonUpdate = JSON.stringify(update);

        const settings = {
          method: "PATCH",
          body: jsonUpdate,
          headers: {
            "Content-Type": "application/json"
          }
        }

        // Now make a second fetch request to add the latest album to the "albums" array of the current user
        // We will send 2x useful data...
        // The _id of the new album will go in the request BODY
        // The _id of the current user will go in the request URL as a PARAMETER
        //                                        ^
        fetch(`http://localhost:3001/user/${currentUser._id}`, settings)
          .then(secondResponse => {
            if (secondResponse.ok) {
              return secondResponse.json();
            } else {
              switch(secondResponse.status) {
                case 400:
                  throw new Error("Error: album could not be added - please try again")
                case 404:
                  throw new Error("Error: user does not exist");
                case 409:
                  throw new Error("Error: you have already added this album")
                default:
                  throw new Error("Error: server error - please try again");
              }
            }
          })
          .then(secondReqData => {
            // Update the "currentUser" state variable
            setCurrentUser(secondReqData);
            // Reset the values of the inputs
            setBand("");
            setTitle("");
            setYear("");
          })
          .catch((err) => {
            // Show an alert to tell the user what went wrong with the PATCH request to /user
            alert(err.message);
          });
      })
      .catch((err) => {
        // Show an alert to tell the user what went wrong with the POST request to /albums
        alert(err.message);
      });
  };

  // ===============================================================

  // Function to handle submitting login details
  const submitLoginData = (event) => {
    event.preventDefault();

    const loginDetails = {
      username: username,
      password: password,
    };

    const jsonLoginDetails = JSON.stringify(loginDetails);

    const settings = {
      method: "POST",
      body: jsonLoginDetails,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include"
    };

    //fetch(`${process.env.API_URL}/login`, settings)
    fetch("http://localhost:3001/login", settings)
      .then(response => {
        // If we get back an error, "response.ok" will be false!
        if (response.ok) {
          return response.json();
        } else {
          // Throw a new error and go to the "catch" block
          switch(response.status) {
            // If we get a 401 error with a specific "message" property, put that value into an Error and throw it.
            case 401:
              return response.json().then(err => {
                throw new Error(err.message);
              })
            default:
              throw new Error("Error: server error - please try again");
          }
        }
      })
      .then((data) => {
        console.log("currentUser", data);
        // Update "currentUser" state variable
        setCurrentUser(data);
        setUsername("");
        setPassword("");
      })
      .catch((e) => {
        // Show an alert to tell the user something went wrong
        alert(e.message);
        setUsername("");
        setPassword("");
      });
  };

  // ===============================================================

  // Function to handle deleting ALL the current user's albums
  const deleteAllAlbums = () => {
    const user = {
      _id: currentUser._id
    }

    const jsonUser = JSON.stringify(user);

    const settings = {
      method: "DELETE",
      body: jsonUser,
      headers: {
        "Content-Type": "application/json"
      },
      // Any time we want to send a cookie with a fetch() request
      // We need to set "credentials: 'include'"
      credentials: "include"
    }

    // Make a DELETE request to the "/albums" endpoint
    fetch("http://localhost:3001/albums", settings)
      .then(response => {
        if (response.ok) {
          return response.json();
          // If the request was unsuccessful
        } else {
          // Check the status of the response
          switch (response.status) {
            case 404:
              throw new Error("Error: User not found");
            default:
              throw new Error("Error: Unknown error");
          }
        }
      })
      .then(data => {
        setCurrentUser(data);
      })
      .catch(err => {
        alert(err.message);
      })
  }

  // ===============================================================

  // Function to handle deleting an album from the db
  // This will contain:
  //   (1) the deleted album's _id as a URL PARAM
  //   (2) the current user's _id in the BODY of the request
  const deleteAlbum = (event) => {
    const deletedAlbumId = event.target.parentElement.id; // The id of the album we want to delete

    // Create an object containing a "userId" property
    const deleteDetails = {
      userId: currentUser._id // The current user's _id
    };

    const jsonDeleteDetails = JSON.stringify(deleteDetails);

    const settings = {
      method: "DELETE",
      body: jsonDeleteDetails,
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include"
    }

    fetch(`http://localhost:3001/albums/${deletedAlbumId}`, settings)
    .then(response => {
      if (response.ok) {
        return response.json()
      } else {
        switch(response.status) {
          case 403:
            throw new Error("Error: The action was forbidden - try again")
          case 404:
            throw new Error("Error: User not found")
          default:
            throw new Error("Error: Server error - try again")
        }
      }
    })
    .then(data => {
      setCurrentUser(data);
    })
    .catch(e => {
      alert(e.message);
    });
  };

  // ===============================================================

  // Function to handle deleting the current user from the "users" collection
  const deleteUser = () => {
    const settings = {
      method: "DELETE"
    }

    fetch(`http://localhost:3001/user/${currentUser._id}`, settings)
      .then(response => {
        if (response.ok) {
          return response.json()
        } else {
          switch (response.status) {
            case 404:
              throw new Error("Error: User not found");
            default:
              throw new Error("Error: Server error - please try again");
          }
        }
      })
      .then(data => {
        alert("Your account has been deleted!");
        setCurrentUser(data);
      })
      .catch(err => {
        alert(err.message);
      })
  }

  // Every time we update the "albums" state variable we will automatically re-render the app...
  // When this happens, map the new version of "albums"...
  // ... and create a new list item for every album, which we can render in the <ul> in our JSX
  const renderedAlbums = currentUser.albums.map((album) => {
    let albumDetails = `${album.title} by ${album.band} (${album.year})`;
    // 19/10 - New functionality: click the X to delete the album *from the DB*
    // When the app re-renders, the album will no longer be rendered
    return (
      <li key={album._id} id={album._id}> {albumDetails} : <span onClick={deleteAlbum}>X</span></li>
    );
  });

  console.log("currentUser", currentUser);

  // Conditional rendering
  return (
    <div>
      {currentUser.username.length === 0 ? (
        <div>
          <h1>Login to Add an Album</h1>

          <form onSubmit={submitLoginData}>
            <div>
              <label>Username</label>
              <input name="username" onChange={changeData} value={username} />
            </div>
            <div>
              <label>Password</label>
              <input name="password" onChange={changeData} value={password} />
            </div>

            <button>Sign In</button>
          </form>
        </div>
      ) : (
        <div>
          <div>
            Welcome {currentUser.username}!
            <button onClick={deleteUser}>Delete User!</button>
          </div>
          <h1>Add an Album to the Collection!</h1>

          <form onSubmit={submitForm}>
            <div>
              <label>Band</label>
              <input name="band" onChange={changeData} value={band} />
            </div>
            <div>
              <label>Title</label>
              <input name="title" onChange={changeData} value={title} />
            </div>
            <div>
              <label>Year</label>
              <input name="year" onChange={changeData} value={year} />
            </div>
            <button>Submit Album</button>
          </form>

          {/* <form onSubmit={updateAlbum}>
            <h3>Update your album</h3>
            <div>
              <label>Band</label>
              <input name="band" onChange={changeUpdateData} value={albumToBeUpdated.band} />
            </div>
            <div>
              <label>Title</label>
              <input name="title" onChange={changeUpdateData} value={albumToBeUpdated.title} />
            </div>
            <div>
              <label>Year</label>
              <input name="year" onChange={changeUpdateData}
              value={albumToBeUpdated.year} />
            </div>
            <button>Update Album</button>
          </form> */}

          <div>
            <h2>Current Albums:</h2>

            <ul>{renderedAlbums}</ul>
          </div>

          <button onClick={deleteAllAlbums}>Delete All Albums!</button>
        </div>
      )}
    </div>
  );
};

export default App;
