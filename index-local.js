"use strict";

import { imageResize } from "./index.js";
import eventJson from "./form/OriginResponseEvent.json" assert { type: "json" };
import fs from "fs";

export const imageResizeToFile = async (event, context) => {
  console.log("imageResizeToFile start!!");
  event = eventJson;
  const extension = eventJson.Records[0].cf.request.uri.split(".").pop();

  console.log("===============================");
  const response = await imageResize(event, context);
  console.log("===============================");

  const buf = Buffer.from(response.body, "base64");
  fs.writeFile(`output/image.${extension}`, buf, function (err, result) {
    if (err) {
      console.log("error", err);
    }
  });

  console.log("imageResizeToFile end!!");
};
