// src/components/Charts.jsx
import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

// Line Chart component (Orders Per Hour for example)
export const LineChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="hour" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Bar Chart component (Top Vendors by sales for example)
export const BarChartComponent = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" width={150} />
        <Tooltip />
        <Bar dataKey="total_sales" fill="#fbbf24">
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill="#fbbf24" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

// Donut Chart component (Order Status Distribution for example)
export const DonutChartComponent = ({ data }) => {
  const COLORS = ["#22c55e", "#fbbf24", "#6366f1", "#ef4444"]; // Green, Yellow, Indigo, Red

  // Convert object to array if needed (for example if data is {completed: 10, pending: 5})
  let chartData = [];
  if (!Array.isArray(data)) {
    chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  } else {
    chartData = data;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          innerRadius={50}
          label
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
};
