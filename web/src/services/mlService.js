import axios from "axios";

export const getMLPredictions = async () => {
  try {
    const res = await axios.get("/api/ml/predictions");
    return res.data.data;
  } catch (err) {
    console.error("ML fetch error:", err);
    return [];
  }
};