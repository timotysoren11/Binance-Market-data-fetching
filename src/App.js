import React, { useEffect, useState, useRef, useCallback } from 'react';
import './App.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';

// Registering the components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip, Legend);

const wsBaseUrl = 'wss://stream.binance.com:9443/ws/';

const App = () => {
  const [symbol, setSymbol] = useState('ethusdt');
  const [interval, setInterval] = useState('1m');
  const [chartData, setChartData] = useState({});
  const ws = useRef(null);

  const cryptoOptions = [
    { label: 'ETH/USDT', value: 'ethusdt' },
    { label: 'BNB/USDT', value: 'bnbusdt' },
    { label: 'DOT/USDT', value: 'dotusdt' },
  ];

  const intervalOptions = ['1m', '3m', '5m'];

  const updateChartData = useCallback((candlestick) => {
    const openTime = new Date(candlestick.t);
    const newCandle = {
      time: openTime,
      open: candlestick.o,
      high: candlestick.h,
      low: candlestick.l,
      close: candlestick.c,
    };

    setChartData((prevData) => {
      const updatedData = { ...prevData };
      updatedData[symbol] = updatedData[symbol] || [];
      updatedData[symbol].push(newCandle);

      // updation of local storage
      localStorage.setItem(symbol, JSON.stringify(updatedData[symbol]));

      return updatedData;
    });
  }, [symbol]);

  const fetchMarketData = useCallback(() => {
    if (ws.current) {
      ws.current.close();
    }

    ws.current = new WebSocket(`${wsBaseUrl}${symbol}@kline_${interval}`);

    ws.current.onmessage = (event) => {
      const { k: candlestick } = JSON.parse(event.data);
      updateChartData(candlestick);
    };
  }, [symbol, interval, updateChartData]);

  useEffect(() => {
    const savedData = localStorage.getItem(symbol);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setChartData((prevData) => ({ ...prevData, [symbol]: parsedData }));
      } catch (error) {
        console.error("Error parsing saved data:", error);
      }
    }

    fetchMarketData();

    return () => {
      if (ws.current) ws.current.close();
    };
  }, [symbol, interval, fetchMarketData]);

  // Chart options
const data = {
  labels: chartData[symbol]?.map((item) => new Date(item.time).toLocaleTimeString()) || [],
  datasets: [
    {
      label: `${symbol.toUpperCase()} Candlestick Chart`,
      data: chartData[symbol]?.map((item) => item.close) || [],
      borderColor: 'rgba(75, 192, 192, 1)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      fill: false,
    },
  ],
};

  return (
    <div className="App">
      <h1>Binance Market Data WebSocket</h1>
      <div className='select-option'>
        <label>Choose Cryptocurrency:</label>
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}>
          {cryptoOptions.map((crypto) => (
            <option key={crypto.value} value={crypto.value}>
              {crypto.label}
            </option>
          ))}
        </select>
      </div>

      <div className='intervals-container'>
        <label>Select Interval:</label>
        <select value={interval} onChange={(e) => setInterval(e.target.value)}>
          {intervalOptions.map((intv) => (
            <option key={intv} value={intv}>
              {intv}
            </option>
          ))}
        </select>
      </div>

      <div className='data-container'>
        <Line key={symbol} data={data} />
      </div>
    </div>
  );
};

export default App;
