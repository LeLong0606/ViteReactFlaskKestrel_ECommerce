import React from "react";
import "./Chat.css";
import "./bootstrap.min.css";
import '@fortawesome/fontawesome-free/css/all.min.css';
import SoundNotification from './SoundNotification.mp3';
import ReactMarkdown from 'react-markdown';

class Chat extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      chatVisible: false,
      messages: []
    };
    this.audio = new Audio(SoundNotification);
  }

  componentDidMount() {
    // Attach submit event to the form when the component mounts
    document.getElementById("messageArea").addEventListener("submit", this.handleSubmit);
  }

  componentWillUnmount() {
    // Remove submit event when the component unmounts to avoid memory leaks
    document.getElementById("messageArea").removeEventListener("submit", this.handleSubmit);
  }

  handleSubmit = (event) => {
    event.preventDefault();
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const str_time = hour + ":" + minute;
    const rawText = document.getElementById("text").value;

    // Display user's message
    const userMessage = {
      type: 'user',
      text: rawText,
      time: str_time
    };

    this.setState(prevState => ({
      messages: [...prevState.messages, userMessage]
    }));

    document.getElementById("text").value = ""; // Clear input content

    // Send request to the server
    fetch("http://127.0.0.1:8080/api/get", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        msg: rawText
      })
    })
    .then(response => response.json())  // Convert response to JSON
    .then(data => {
      // Handle response from the server
      const botMessage = {
        type: 'bot',
        response: data.response,
        time: str_time
      };

      this.setState(prevState => ({
        messages: [...prevState.messages, botMessage]
      }));

      this.audio.play(); // Play notification sound
    })
    .catch(error => {
      console.error("Error:", error);
    });
  }

  toggleChat = () => {
    this.setState(prevState => ({
      chatVisible: !prevState.chatVisible
    }));
  }

  render() {
    return (
      <div>
        <div className="chat-bubble" onClick={this.toggleChat}>
            <i className="fa-solid fa-comments"></i>
        </div>
        <div className="chat-container" id="chatContainer" style={{ display: this.state.chatVisible ? 'block' : 'none' }}>
          <div className="card">
            <div className="card-header msg_head">
              <div className="d-flex bd-highlight">
                <div className="img_cont">
                  <img src="/static/r1BEKAxsbq.gif" className="rounded-circle user_img" alt="User Avatar" />
                  <span className="online_icon"></span>
                </div>
                <div className="user_info">
                  <span>Orion - WebShop Tech Shop Virtual Assistant</span>
                  <p>Ask me anything!</p>
                </div>
              </div>
            </div>
            <div id="messageFormeight" className="card-body msg_card_body">
              {this.state.messages.map((message, index) => (
                <div key={index} className={`d-flex ${message.type === 'user' ? 'justify-content-end' : 'justify-content-start'} mb-4`}>
                  {message.type === 'bot' && (
                    <div className="img_cont_msg">
                      <img src="/static/r1BEKAxsbq.gif" className="rounded-circle user_img_msg" alt="Bot Avatar" />
                    </div>
                  )}
                  <div className={`msg_cotainer${message.type === 'user' ? '_send' : ''}`}>
                    {message.type === 'bot' ? <ReactMarkdown>{message.response}</ReactMarkdown> : message.text}
                    <span className={`msg_time${message.type === 'user' ? '_send' : ''}`}>{message.time}</span>
                  </div>
                  {message.type === 'user' && (
                    <div className="img_cont_msg">
                      <img src="/static/8aa4595fb24b6ed585dddac4622b2445.gif" className="rounded-circle user_img_msg" alt="User Avatar" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="card-footer">
              <form id="messageArea" className="input-group">
                <input type="text" id="text" name="msg" placeholder="Type your message..." autoComplete="off" className="form-control type_msg" required />
                <div className="input-group-append">
                  <button type="submit" id="send" className="input-group-text send_btn"><i className="fas fa-location-arrow"></i></button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Chat;
