import Form from "../../common/form";
import React from "react";
import Joi from "joi-browser";
import "./chat.css";
import { MESSAGE_SENT } from "../../../events/definitions";
import { defaultRate } from "../../../config/clientSettings";
import uuidv4 from "uuid/v4";
import GetLayout from "../../modules/getLayout";

export default class SendChat extends Form {
  state = {
    data: { sendChat: "" },
    errors: {},
    user: {},
    //uuid: 0, //used to generate keys for locally generated messages
    coolDown: false,
    indicator: false
  };

  componentDidMount() {
    //set the rate limit from global vars
  }

  componentDidUpdate = () => {
    if (this.props.chatTabbed) {
      this.refs.chatForm.sendChat.focus();
    } else {
      this.refs.chatForm.sendChat.blur();
    }
  };

  startTimer = () => {
    if (!this.state.coolDown) {
      this.setState({ coolDown: true });
      this.timer = setTimeout(() => this.stopTimer(), defaultRate);
    }
  };

  stopTimer = () => {
    clearTimeout(this.timer);
    this.setState({ coolDown: false });
  };

  schema = {
    sendChat: Joi.string()
      .min(1)
      .max(512)
      .trim()
      .label("Chat Message")
  };

  doSubmit = () => {
    let keepGoing = true;
    const { user, socket, chatId, server_id, onChatFeedback } = this.props;

    if (user.status && user.status.timeout) {
      keepGoing = false;
      const messageBlank = {
        time_stamp: Date.now(),
        display_message: true,
        type: "moderation",
        sender: "System"
      };
      let toUser = "Unable to send chat messages while timed out";
      let feedback = messageBlank;
      feedback.message = toUser;
      feedback.userId = user.id;
      feedback.chat_id = chatId;
      feedback.server_id = server_id;
      feedback.id = uuidv4();

      onChatFeedback(feedback);
      // console.log(toUser);
    }

    if (this.state.coolDown) {
      keepGoing = false;
      let toUser = `You are sending messages too fast, you must wait at least ${defaultRate /
        1000} seconds before you can send a new message`;
      const messageBlank = {
        time_stamp: Date.now(),
        display_message: true,
        type: "moderation",
        sender: "System"
      };

      let feedback = messageBlank;
      feedback.message = toUser;
      feedback.userId = user.id;
      feedback.chat_id = chatId;
      feedback.server_id = server_id;
      feedback.id = uuidv4();

      onChatFeedback(feedback);
      // console.log(toUser);
      // console.log(feedback.id);
    }

    const { sendChat } = this.state.data;
    if (user !== null && chatId !== "" && keepGoing) {
      socket.emit(MESSAGE_SENT, {
        username: user.username,
        userId: user.id,
        message: sendChat,
        chatId: chatId,
        server_id: server_id
      });
      console.log(
        `SEND TO CHAT, user: ${user.username} userId ${
          user.id
        } message ${sendChat} chatId ${chatId}`
      );

      this.startTimer();
    } else {
      console.log("CANNOT SEND CHAT");
    }

    if (this.state.coolDown) {
      return;
    }
    this.setState({ data: { sendChat: "" } });
    //Set Rate Limit Timer
    //Don't clear the chat unless the message can be sent
  };

  setError = error => {
    this.setState({ error });
  };

  //This should only appear for desktop, no need for mobile
  handleIndicator = () => {
    // console.log(this.props.chatTabbed);
    if (this.props.isModalShowing) {
      return (
        <div className="send-chat-options">
          <div className="indicator" />
          you are inside a modal. close it to regain control
        </div>
      );
    } else if (!this.props.chatTabbed) {
      return (
        <div className="send-chat-options">
          <div className="indicator indicator-active" />
          you are controlling the robot ( --tab to chat )
        </div>
      );
    } else {
      return (
        <div className="send-chat-options">
          <div className="indicator" />
          chatting ( --tab to control robot, or use mouse )
        </div>
      );
    }
  };

  handleFocus = () => {
    this.props.setChatTabbed(true);
  };

  handleBlur = () => {
    this.props.setChatTabbed(false);
  };

  handleDefaultChatForm = () => {
    return (
      <div className="send-chat-container">
        <form
          onSubmit={this.handleSubmit}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          ref="chatForm"
        >
          <div className="input-field-container">
            {this.renderChatInput("sendChat", "", "chat")}
            <div className="send-chat-btn">
              {this.renderButton("Chat", "chat", "chat")}
            </div>
          </div>
        </form>
      </div>
    );
  };

  handleMobile = () => {
    return (
      <React.Fragment>
        <form
          onSubmit={this.handleSubmit}
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          ref="chatForm"
        />
      </React.Fragment>
    );
  };

  ForwardLayout = React.forwardRef((props, ref) => {
    return (
      <GetLayout
        renderDesktop={this.handleDefaultChatForm}
        renderMobile={this.handleMobile}
      >
        {" "}
        {props.children}{" "}
      </GetLayout>
    );
  });

  render() {
    return (
      <React.Fragment>
        <GetLayout renderDesktop={this.handleIndicator} />
        {this.handleDefaultChatForm()}
      </React.Fragment>
    );
  }
}
