import express from "express";
import  { getPredictions } from "../Controllers/mlController.js" ;

const router = express.Router();

router.get("/predictions", getPredictions);

export default router;


