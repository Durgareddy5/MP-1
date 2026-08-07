import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import useMarketStore from '@/store/marketStore';

const LiveChart = ({ symbol }) => {
  const chartRef = useRef();
  const seriesRef = useRef();

  const price = useMarketStore((s) => s.prices[symbol]);

  useEffect(() => {
    const chart = createChart(chartRef.current, {
      height: 300,
    });

    const lineSeries = chart.addLineSeries();

    seriesRef.current = lineSeries;

    return () => chart.remove();
  }, []);

  useEffect(() => {
    if (!price || !seriesRef.current) return;

    seriesRef.current.update({
      time: Math.floor(price.timestamp / 1000),
      value: price.price,
    });
  }, [price]);

  return <div ref={chartRef} />;
};

export default LiveChart;