const router = require("express").Router();
const auth = require("../auth");
// then to use that it would be like router.post('/test', auth({robot: true, user: true}), (req, res ) => { ... })

router.get("/", async (req, res) => {
  res.send({ message: "get controls" });
});

router.post("/make", auth({ robot: true, user: true }), async (req, res) => {
  let response = {};
  let validate = false;
  const {
    getServerIdFromChannelId,
    getChannel
  } = require("../../models/channel");
  const { buildButtons } = require("../../models/controls");
  const { getRobotServer } = require("../../models/robotServer");

  let checkUser = await getServerIdFromChannelId(req.body.channel_id);
  checkUser = await getRobotServer(checkUser.result);
  if (checkUser.owner_id === req.user.id) validate = true;
  if (req.body.channel_id && req.body.buttons && validate) {
    const checkForControls = await getChannel(req.body.channel_id);
    const setControls = await buildButtons(
      req.body.buttons,
      req.body.channel_id,
      checkForControls.controls
    );

    response.status = "success";
    response.result = setControls;
  } else {
    response.status = "error!";
    response.error = "could not generate controls from input";
  }
  res.send(response);
});

router.post(
  "/button-input",
  auth({ robot: true, user: true }),
  async (req, res) => {
    if (req.body.channel_id) {
      const {
        getButtonInputForChannel
      } = require("../../controllers/controls");
      const input = await getButtonInputForChannel(req.body.channel_id);
      res.send(input);
      return;
    }
    res.send({
      status: "error!",
      error: "unable to get button input"
    });
  }
);

module.exports = router;
