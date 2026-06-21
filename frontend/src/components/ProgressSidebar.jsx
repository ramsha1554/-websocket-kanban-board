import React from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { COLUMNS } from "../constants";

export default function ProgressSidebar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const chartData = COLUMNS.map((c) => ({
    name: c.label,
    count: tasks.filter((t) => t.column === c.key).length,
  }));

  return (
    <div className="w-full lg:w-[220px] bg-white border-t lg:border-t-0 lg:border-l border-[#DFE1E6] p-4 shrink-0">
      <div style={{ fontSize: 10, color: "#7A869A", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
        Progress
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color: "#172B4D", marginBottom: 16 }}>{percent}%</div>

      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={chartData} barSize={24}>
          <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 9 }} width={20} />
          <Tooltip />
          <Bar dataKey="count" fill="#0052CC" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      {COLUMNS.map((col) => {
        const count = tasks.filter((t) => t.column === col.key).length;
        const pct = total === 0 ? 0 : Math.round((count / total) * 100);
        const barColor = col.key === "todo" ? "#888780" : col.key === "inprogress" ? "#0052CC" : "#1D9E75";
        return (
          <div key={col.key} style={{ marginTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#7A869A", marginBottom: 4 }}>
              <span>{col.label}</span>
              <span>{count}</span>
            </div>
            <div style={{ height: 5, background: "#F4F5F7" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, transition: "width 0.3s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}