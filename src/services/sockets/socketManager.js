const io = require("./sockets").io;
const { createUser, createMessage, createChat } = require("./factories");
const {
  TEST_EVENT,
  TEST_RESPONSE,
  VERIFY_USER,
  USER_CONNECTED,
  USER_DISCONNECTED,
  LOGOUT,
  USERS_UPDATED,
  LOCAL_CHAT,
  HEARTBEAT,
  MESSAGE_SENT,
  MESSAGE_RECIEVED
} = require("./events");

const { heartBeat } = require("./settings");

let connectedUsers = {};
let localChat = createChat();
let heartBeatStarted = false;

let initChat = false;
let userRoom = ""; //Used to emit events to individual users

module.exports = function(socket) {
  if (!heartBeatStarted) {
    beat(io);
    heartBeatStarted = true;
  }

  if (!initChat) {
    console.log("Chat Room: ", localChat.name);
    initChat = true;
  }
  //Socket will emit this message with successful connection
  //console.log("Socket Id:" + socket.id);

  socket.on(TEST_EVENT, () => {
    console.log("Test Event Recieved");
    const beep = "beep";
    io.emit(TEST_RESPONSE, testResponse(beep));
  });

  socket.on(VERIFY_USER, (data, callback) => {
    const { username } = data;

    if (isUser(connectedUsers, username)) {
      callback({ isUser: true, user: null });
    } else {
      let user = createUser({ name: username });
      callback({ isUser: false, user: user });

      socket.user = user;
      userRoom = `${socket.user.name}`;
      socket.join(userRoom);
    }
  });

  socket.on(USER_CONNECTED, user => {
    //Note to self: Use chat.id instead of chat name at some point
    let chat = localChat;
    connectedUsers = addUser(connectedUsers, user);

    console.log(socket.user);

    sendMessageToChatFromUser = sendMessageToChat(user.name);

    io.emit(USERS_UPDATED, connectedUsers);
    socket.emit(LOCAL_CHAT, chat);
    console.log("chat stuff: ", chat.name, chat);
    socket.join(chat.name);
  });

  socket.on(LOGOUT, user => {
    connectedUsers = removeUser(connectedUsers, user["name"]);
    io.emit(USER_DISCONNECTED, user);
    io.emit(USERS_UPDATED, connectedUsers);
    //console.log("Disconnect", user, "User List UpdateD: ", connectedUsers);
    io.to(userRoom).emit(userRoom, " is no longer here yo!");
  });

  //Get Community Chat
  socket.on(LOCAL_CHAT, callback => {
    callback(localChat);
  });

  //How do i tell which user?
  socket.on("disconnect", () => {
    console.log("Lost connection to user: ");
  });

  socket.on(HEARTBEAT, user => {});

  socket.on(MESSAGE_SENT, message => {
    sendMessageToChatFromUser(localChat.name, message.message);
  });
};

function testResponse(test) {
  console.log("Test Response Sent: ", test);
  return test;
}

/*
Adds user to list passed in
@param userList { object } Object with key value pairs of users
@param user { user } the user to be added to the list
@return userList { object } Object with key value pairs of users */
function addUser(userList, user) {
  let newList = Object.assign({}, userList);
  newList[user.name] = user;
  return newList;
}

/*
Checks if the user is in the list passed in.
@param userList { object } Object with key value pairs of Users
@param username { string }
@return userList { object } Object with key value pairs of Users */
function isUser(userList, username) {
  return username in userList;
}

/*
Removes user from the list passed in
@param userList { object } Object with key value pairs of Users
@param username { string } name of user to be removed
@return userList { object } Object with key value pairs of Users */
function removeUser(userList, username) {
  let newList = Object.assign({}, userList);
  delete newList[username];
  return newList;
}

//Heartbeat
function beat(io) {
  let timerId = setTimeout(
    (tick = () => {
      //console.log("badum!");
      io.emit(HEARTBEAT);
      timerId = setTimeout(tick, heartBeat); // (*)
    }),
    heartBeat
  );
}

/*
 * Returns a function that will take a chat id and message
 * and then emit a broadcast to the chat id.
 * @param sender {string} username of sender
 * @return function(chatId, message)
 */
function sendMessageToChat(sender) {
  return (chatroom, message) => {
    io.to(chatroom).emit(MESSAGE_RECIEVED, createMessage({ message, sender }));
  };
}
