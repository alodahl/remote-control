const robot = require("../models/robot");

module.exports = async (ws, data) => {
  const getRobot = await robot.authRobot(data.token);
  if (getRobot) {
    //setup private user sub for user events
    ws.robot = getRobot;

    console.log("AUTH ROBOT: ", getRobot.name);

    //Confirm Validation:
    ws.emitEvent("ROBOT_VALIDATED", {
      id: getRobot.id,
      host: getRobot.host_id
    });
  }
};
