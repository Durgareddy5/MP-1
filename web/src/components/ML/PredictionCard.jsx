export default function PredictionCard({ stock }) {
  return (
    <div style={{
      border: "1px solid #ccc",
      padding: 10,
      marginBottom: 10
    }}>
      <h3>{stock.symbol}</h3>
      <p>Predicted: {stock.predicted_price}</p>
      <p>Current: {stock.last_price}</p>
      <p>
        Action:
        <strong style={{
          color:
            stock.action === "BUY"
              ? "green"
              : stock.action === "SELL"
              ? "red"
              : "gray"
        }}>
          {stock.action}
        </strong>
      </p>
    </div>
  );
}