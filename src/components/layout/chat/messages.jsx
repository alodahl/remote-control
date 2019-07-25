import React, { Component } from "react";
import Message from "./message";

export default class Messages extends Component {
  constructor(props) {
    super(props);
    this.scrollDown = this.scrollDown.bind(this);
  }

  scrollDown() {
    const { container } = this.refs;
    container.scrollTop = container.scrollHeight;
  }

  componentDidMount() {
    this.scrollDown();
  }

  componentDidUpdate(prevProps, prevState) {
    this.scrollDown();
  }

  displayMessages = messages => {
    //console.log("messages", messages);
    console.log("FROM DISPLAY MESSAGES CHECK: ", messages);
    return messages.map(message => {
      if (message.display_message) {
        return (
          <Message
            message={message}
            key={message["id"]}
            color={message.color}
          />
        );
      }
      return <React.Fragment />;
    });
  };

  render() {
    return (
      <React.Fragment>
        <div ref="container" className="chat-scroll">
          {this.displayMessages(this.props.messages)}
        </div>
      </React.Fragment>
    );
  }
}
