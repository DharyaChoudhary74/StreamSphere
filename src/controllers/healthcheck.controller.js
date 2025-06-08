import { ApiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  //TODO: build a healthcheck response that simply returns the OK status as json with a message
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        { message: "ok" },
        "Successfully fetched healthcheck"
      )
    );
});

export { healthcheck };