import axios from "axios";

const ML_URL = "http://localhost:8001/predict";

export const getPredictions = async (req, res) => {
  try {
    const response = await axios.get(ML_URL);

    res.json({
      success: true,
      data: response.data.data || response.data
    });

  } catch (error) {
    console.error("ML Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch predictions"
    });
  }
};