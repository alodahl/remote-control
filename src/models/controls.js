/*
import SendChat from '../components/layout/chat/sendChat';
Controls are assigned to a channel, and not tied to a specific robot
Multiple channels on a robot_server can load the same control set & feed it to different robots
Right now this only covers buttons, will will eventually include other types of input
*/
const { makeId, createTimeStamp } = require("../modules/utilities");

//TEMPORARY VALUES JUST TO ENSURE VALIDATION:
testControls = [
  { label: "forward", hot_key: "w", command: "f", id: "1" },
  { label: "back", hot_key: "s", command: "b", id: "2" },
  { label: "left", hot_key: "a", command: "l", id: "4" },
  { label: "right", hot_key: "d", command: "r", id: "3" }
];

const defaultStatus = () => {
  return {
    placeholder: "test"
  };
};
const defaultSettings = () => {
  return {
    enabled: true
  };
};

module.exports.createControls = async controls => {
  let makeInterface = {};
  makeInterface.id = controls.id || `cont-${makeId()}`;
  makeInterface.created = createTimeStamp();
  makeInterface.channel_id = controls.channel_id || "dev";
  makeInterface.buttons = controls.buttons || testControls;
  makeInterface.settings = controls.settings || defaultSettings();
  makeInterface.status = controls.status || defaultStatus();
  // makeInterface.button_input = controls

  //save controls
  console.log("SAVING CONTROLS: ", makeInterface);
  const save = await this.saveControls(makeInterface);
  console.log(save);
  if (save) {
    console.log("CONTROL INTERFACE CREATED: ", makeInterface);
    return makeInterface;
  }
  return null;
};

module.exports.updateControls = async controls => {
  console.log("UPDATING EXISTING CONTROLS: ", controls);
  const db = require("../services/db");
  const { buttons, id } = controls;
  const query = `UPDATE controls SET buttons = $1 WHERE id = $2 RETURNING *`;
  try {
    const result = await db.query(query, [buttons, id]);
    // console.log(result.rows[0]);
    if (result.rows[0]) {
      const details = result.rows[0];
      this.sendUpdatedControls(details.id, details.channel_id);
      return result.rows[0];
    }
  } catch (err) {
    console.log(err);
  }
  return { status: "error!", error: "Problem updating controls" };
};

module.exports.saveControls = async controls => {
  console.log("SAVING CONTROLS TO DB: ", controls);
  const db = require("../services/db");
  const { id, channel_id, created, buttons, settings, status } = controls;
  const dbPut = `INSERT INTO controls (id, channel_id, created, buttons, settings, status) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`;
  try {
    const save = await db.query(dbPut, [
      id,
      channel_id,
      created,
      buttons,
      settings,
      status
    ]);
    console.log(save.rows);
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
  return null;
};

module.exports.getControls = async (id, channel_id) => {
  if (id) {
    //console.log("Get controls from controls ID: ", id);
    const db = require("../services/db");
    const query = `SELECT * FROM controls WHERE id = $1 LIMIT 1`;
    try {
      const result = await db.query(query, [id]);
      //console.log(result.rows[0]);
      if (result.rows[0]) return result.rows[0];
      console.log("Error, could not fetch data for CONTROLS");
      return null;
    } catch (err) {
      console.log(err);
      return null;
    }
  } else {
    console.log(
      "No controls found on this channel, generating controls for this channel"
    );
    if (channel_id) {
      const { setControls } = require("./channel");
      const makeControls = await this.createControls({
        channel_id: channel_id
      });
      setControls({
        id: makeControls.id,
        channel_id: channel_id
      });
      if (makeControls) return makeControls;
    }
    console.log("Error, cannot find or generate controls for this channel");
  }
  return null;
};

//TODO: Check against user & user roles
//is user timed out?
//Does user have privelage to use this command?
module.exports.validateInput = async input => {
  //console.log("VALIDATE INPUT: ", input);
  let response = {};
  let validate = false;
  const checkInput = await this.getControls(input.controls_id, input.channel);
  if (checkInput && checkInput.buttons) {
    checkInput.buttons.map(button => {
      if (button.label === input.button.label) validate = true;
    });
  } else {
    console.log(
      "No buttons found, validating against default controls instead"
    );
    testControls.map(button => {
      if (button.label === input.button.label) validate = true;
    });
  }

  if (validate) response.validated = true;
  if (!validate) response.validated = false;
  console.log("Validation Result: ", response.validated);
  return response;
};

//input: { label: "<string>", hot_key: "<string>", command: "<string>"}
//output: array of button objects w/ id generated per button
module.exports.buildButtons = async (buttons, channel_id, controls_id) => {
  let response = {};
  let newButtons = [];
  let buildControls = {};
  buildControls.channel_id = channel_id;
  buildControls.id = controls_id;
  //generate json
  if (buttons) {
    buttons.forEach(button => {
      button.id = `bttn-${makeId()}`;
      newButtons.push(button);
    });
  } else {
    return { status: "error!", error: "invalid data to generate buttons" };
  }

  buildControls.buttons = newButtons;
  generateControls = await this.updateControls(buildControls);
  if (generateControls) {
    response.status = "success";
    response.result = generateControls;
    return response;
  }
  response.status = "error";
  response.error = "problem build buttons (controls.js/buildButtons)";
  return response;
};

module.exports.sendUpdatedControls = async (controls_id, channel_id) => {
  //send current controls for current channel to the client
  //channel stores an ID reference for it's current controls
  const channel = require("./channel");
  let sendData = {};
  sendData = await this.getControls(controls_id, channel_id);
  channel.emitEvent(channel_id, "CONTROLS_UPDATED", sendData);
};

module.exports.getControlsFromId = async id => {
  console.log("GET CONTROLS FROM ID: ", id);
  const db = require("../services/db");
  const query = `SELECT * FROM controls WHERE id = $1`;
  try {
    const result = await db.query(query, [id]);
    if (result.rows[0]) return result.rows[0];
  } catch (err) {
    console.log(err);
  }
  return null;
};

module.exports.getControlsForChannel = async channel_id => {
  const db = require("../services/db");
  const query = `SELECT * FROM controls WHERE channel_id = $1`;
  try {
    const result = await db.query(query, [channel_id]);
    if (result.rows[0]) return result.rows[0];
  } catch (err) {
    console.log(err);
  }
  return null;
};
