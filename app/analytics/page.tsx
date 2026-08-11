"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from "recharts";
import { Send, TrendingUp, Percent } from "lucide-react";

interface Analytics {
  total: number;
  byStatus: Record<string, number>;
  conversionRate: number;
  timeline: { month: string; count: number }[];
}

// Status hues tuned for the light surface.
const STATUS_COLORS: Record<string, string> = {
  APPLIED: "#6B7280",
  SCREENING: "#0284C7",
  INTERVIEW: "#D97706",
  OFFER: "#16A34A",
  REJECTED: "#DC2626",
};

const GRID_COLOR = "#E5E7EB";

const TOOLTIP_STYLE = {
  background: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: 10,
  fontSize: 12,
  color: "#17171B",
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-inkDim text-sm">Loading analytics…</p>;

  const statusData = Object.entries(data.byStatus).map(([status, count]) => ({ status, count }));
  const pieData = statusData.filter((d) => d.count > 0);

  return (
    <div>
      <h1 className="font-display font-extrabold text-2xl text-ink mb-0.5">Analytics</h1>
      <p className="text-inkDim text-sm mb-6">The full picture of your job search.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="card p-5">
          <div className="flex items-center gap-2 text-inkDim text-xs font-semibold mb-1"><Send size={13} /> Total applications</div>
          <div className="font-display font-black text-4xl text-ink">{data.total}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-inkDim text-xs font-semibold mb-1"><Percent size={13} /> Interview conversion</div>
          <div className="font-display font-black text-4xl text-leaf">{data.conversionRate}%</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-inkDim text-xs font-semibold mb-1"><TrendingUp size={13} /> Offers</div>
          <div className="font-display font-black text-4xl text-leaf">{data.byStatus.OFFER}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="card p-5">
          <p className="text-sm font-semibold text-ink mb-3">Applications by status</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="status" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={{ stroke: GRID_COLOR }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-ink mb-3">Status breakdown</p>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="count" nameKey="status" innerRadius={50} outerRadius={85} paddingAngle={2}>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5 lg:col-span-2">
          <p className="text-sm font-semibold text-ink mb-3">Applications over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
              <XAxis dataKey="month" stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={{ stroke: GRID_COLOR }} />
              <YAxis stroke="#8A8A93" fontSize={11} tickLine={false} axisLine={{ stroke: GRID_COLOR }} allowDecimals={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Line type="monotone" dataKey="count" stroke="#16A34A" strokeWidth={3} dot={{ fill: "#16A34A", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
          {data.timeline.length === 0 && (
            <p className="text-inkDim text-sm text-center py-8">No applications tracked yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
