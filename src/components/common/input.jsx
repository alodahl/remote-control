import React from "react";
import "../../styles/common.css";

const Input = ({ name, label, error, type, ref, ...rest }) => {
  console.log("Input Props: ", type, ref);

  return (
    <React.Fragment>
      <div className="form-container">
        <div className="form-group">
          <label className="form-label" htmlFor={name}>
            {label}
          </label>
          <input
            {...rest}
            ref={ref}
            type={type}
            name={name}
            className={type === "chat" ? "chat-input" : "form-control"}
            autoComplete={type === "chat" ? "off" : ""}
          />
        </div>
        {type === "chat" ||
          (error && <div className="alert alert-danger">{error}</div>)}
      </div>
    </React.Fragment>
  );
};

export default Input;
