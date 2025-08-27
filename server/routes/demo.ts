import { RequestHandler } from "express";
import { DemoResponse } from "@shared/api";

export const handleDemo: RequestHandler = (req, res) => {
  const response: DemoResponse = {
    message: "From Almark Tech Solutions, Check our app on: https://almarktechsolutions.netlify.app/",
  };
  res.status(200).json(response);
};
