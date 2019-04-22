import React, { Component } from "react";
import Login from "./login/login";
import io from "socket.io-client";
import {
  TEST_EVENT,
  TEST_RESPONSE,
  USER_CONNECTED,
  LOGOUT
} from "../../services/sockets/events";

const socketUrl = "http://localhost:3231";
export default class Layout extends Component {
  constructor(props) {
    super(props);

    this.state = {
      socket: null,
      user: null
    };
  }

  async componentDidMount() {
    await this.initSocket();
    this.handleResponse();
  }

  initSocket = () => {
    const socket = io(socketUrl);
    socket.on("connect", () => {
      console.log("Socket Connected: ", socket);
    });
    this.setState({ socket });
  };

  setUser = user => {
    const { socket } = this.state;
    socket.emit(USER_CONNECTED, user);
    this.setState({ user });
  };

  //Sets the user property in state to null
  logout = () => {
    const { socket } = this.state;
    socket.emit(LOGOUT);
    this.setState({ user: null });
  };

  handleClick = e => {
    const { socket } = this.state;
    socket.emit(TEST_EVENT);
    console.log("Message Sent: ", TEST_EVENT);
  };

  handleResponse = () => {
    const { socket } = this.state;
    if (socket !== null) {
      socket.on(TEST_RESPONSE, () => {
        console.log("Test Response!");
        socket.emit("Emitting Things");
      });
      socket.on(USER_CONNECTED, user => {
        user
          ? this.setState({ user: user })
          : console.log("Unable to get User");
      });
    }
  };

  render() {
    const { user } = this.state;
    if (this.state.user !== null) {
      console.log("User Connected: ", this.state.user);
    }
    return (
      <div>
        {this.state.socket !== null ? (
          <div>
            <div> Socket Connected </div>
            <button className="btn" onClick={this.handleClick}>
              Boop
            </button>
            {!user ? (
              <Login socket={this.state.socket} setUser={this.setUser} />
            ) : (
              <div>Successfully logged in as: {user.name} </div>
            )}
          </div>
        ) : (
          <div> Socket Offline </div>
        )}
      </div>
    );
  }
}