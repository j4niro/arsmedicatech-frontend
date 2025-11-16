import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { metricsAPI } from '../services/api';
import { Button, Card, Input, Label } from './FormComponents';
import { useUser } from './UserContext';
import AreaChart from './visualizations/AreaChart';
import BarChart from './visualizations/BarChart';
import CalendarChart from './visualizations/CalendarChart';
import Heatmap from './visualizations/Heatmap';
import LineChart from './visualizations/LineChart';
import RadarChart from './visualizations/RadarChart';
import ScatterChart from './visualizations/ScatterChart';

type Metric = {
  metric_name: string;
  metric_value: string;
  metric_unit: string;
};

type MetricSet = {
  user_id: string;
  date: string;
  metrics: Metric[];
};

// New screen for visualizing metrics
function HealthMetricVisualization() {

  const { t } = useTranslation();
  const { user, isLoading: userLoading } = useUser();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [visualizationType, setVisualizationType] = useState<
    'line' | 'bar' | 'scatter' | 'area' | 'radar' | 'heatmap' | 'calendar'
  >('line');
  const [metrics, setMetrics] = useState<MetricSet[]>([]);
  const [metricNames, setMetricNames] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lowerBound, setLowerBound] = useState<number | ''>('');
  const [upperBound, setUpperBound] = useState<number | ''>('');


  useEffect(() => {
    if (!user?.id || !startDate || !endDate) return;
    setLoading(true);
    setError(null);

    metricsAPI
      .getAllForUser(user.id)
      .then(res => {
        const filtered = (res.metrics || []).filter((set: MetricSet) =>
          set.date >= startDate && set.date <= endDate
        );

        setMetrics(filtered);

        const names = Array.from(
          new Set(
            filtered.flatMap((set: MetricSet) =>
              set.metrics.map(m => m.metric_name)
            )
          )
        ) as string[];

        setMetricNames(names);

        if (names.length && selectedMetrics.length === 0)
          setSelectedMetrics(names);

        if (!filtered.length)
          setError(t("noDataRange"));
      })
      .catch(() => setError(t("fetchError")))
      .finally(() => setLoading(false));

  }, [user?.id, startDate, endDate, t, selectedMetrics.length]);

  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev =>
      prev.includes(metric) ? prev.filter(m => m !== metric) : [...prev, metric]
    );
  };

  const chartData = React.useMemo(() => {
    const allDates = metrics.map(set => set.date).sort();
    return selectedMetrics.map(metricName => ({
      metricName,
      points: allDates.map(date => {
        const set = metrics.find(s => s.date === date);
        const metric = set?.metrics.find(m => m.metric_name === metricName);
        const value = metric ? parseFloat(metric.metric_value) : null;
        return { date, value: isNaN(value as number) ? null : value };
      })
    }));
  }, [metrics, selectedMetrics]);

  if (userLoading) return <div>{t("loadingUser")}</div>;

  return (
    <Card className="p-6 space-y-4 w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-semibold">{t("visualizationTitle")}</h2>

      {error && <div className="text-red-600">{error}</div>}

      <div className="flex flex-col md:flex-row gap-4 items-center">

        <div>
          <Label>{t("startDate")}</Label>
          <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>

        <div>
          <Label>{t("endDate")}</Label>
          <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>

        <div>
          <Label>{t("visualizationType")}</Label>
          <select className="border rounded px-2 py-1"
            value={visualizationType}
            onChange={e => setVisualizationType(e.target.value as any)}
          >
            <option value="line">{t("chartLine")}</option>
            <option value="bar">{t("chartBar")}</option>
            <option value="scatter">{t("chartScatter")}</option>
            <option value="area">{t("chartArea")}</option>
            <option value="radar">{t("chartRadar")}</option>
            <option value="heatmap">{t("chartHeatmap")}</option>
            <option value="calendar">{t("chartCalendar")}</option>
          </select>
        </div>

        <div>
          <Label>{t("lowerBound")}</Label>
          <Input type="number" value={lowerBound} onChange={e => setLowerBound(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t("auto")} />
        </div>

        <div>
          <Label>{t("upperBound")}</Label>
          <Input type="number" value={upperBound} onChange={e => setUpperBound(e.target.value === '' ? '' : Number(e.target.value))} placeholder={t("auto")} />
        </div>

        <div>
          <Label>{t("selectMetrics")}</Label>
          <div className="flex flex-col max-h-40 overflow-y-auto border rounded p-2 bg-gray-50">
            {metricNames.map(name => (
              <label key={name} className="flex items-center space-x-2">
                <input type="checkbox" checked={selectedMetrics.includes(name)} onChange={() => handleMetricToggle(name)} />
                <span>{name}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      <div className="mt-8">
        {loading ? (
          <div>{t("loadingChart")}</div>
        ) : chartData.length === 0 || selectedMetrics.length === 0 ? (
          <div>{t("noDataSelected")}</div>
        ) : visualizationType === 'line' ? (
          <LineChart data={chartData} lowerBound={lowerBound} upperBound={upperBound} />
        ) : visualizationType === 'bar' ? (
          <BarChart data={chartData} lowerBound={lowerBound} upperBound={upperBound} />
        ) : visualizationType === 'scatter' ? (
          <ScatterChart data={chartData} lowerBound={lowerBound} upperBound={upperBound} />
        ) : visualizationType === 'area' ? (
          <AreaChart data={chartData} lowerBound={lowerBound} upperBound={upperBound} />
        ) : visualizationType === 'radar' ? (
          <RadarChart data={chartData} date={endDate} />
        ) : visualizationType === 'heatmap' ? (
          <Heatmap data={chartData} />
        ) : (
          <CalendarChart data={chartData} />
        )}
      </div>

    </Card>
  );
}

function HealthMetricTracker() {

  const { t } = useTranslation();
  const { user, isLoading: userLoading } = useUser();

  const [metrics, setMetrics] = useState<Metric[]>([
    { metric_name: '', metric_value: '', metric_unit: '' },
  ]);
  const [date, setDate] = useState<Date | undefined>(() => new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);


  useEffect(() => {
    if (!user?.id || !date) return;
    const isoDate = date.toISOString().slice(0, 10);

    metricsAPI
      .getForUserByDate(user.id, isoDate)
      .then(res => {
        if (res?.metrics?.length) setMetrics(res.metrics);
        else setMetrics([{ metric_name: '', metric_value: '', metric_unit: '' }]);
      })
      .catch(() => setMetrics([{ metric_name: '', metric_value: '', metric_unit: '' }]));

  }, [user?.id, date]);


  const handleMetricChange = (index: number, field: keyof Metric, value: string) => {
    const updated = [...metrics];
    updated[index][field] = value;
    setMetrics(updated);
  };

  const addRow = () => setMetrics([...metrics, { metric_name: '', metric_value: '', metric_unit: '' }]);

  const removeRow = (index: number) => {
    if (metrics.length > 1) {
      const updated = [...metrics];
      updated.splice(index, 1);
      setMetrics(updated);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id || !date) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isoDate = date.toISOString().slice(0, 10);
      await metricsAPI.upsertForUserByDate(user.id, isoDate, metrics);
      setSuccess(t("metricsSaved"));
    } catch {
      setError(t("saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <div>{t("loadingUser")}</div>;

  return (
    <Card className="p-6 space-y-4 w-full max-w-4xl mx-auto mt-8">
      <h2 className="text-xl font-semibold">{t("trackerTitle")}</h2>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}

      <div>
        <Label>{t("selectDate")}</Label>
        <Input type="date" value={date?.toISOString().slice(0, 10)} onChange={e => setDate(new Date(e.target.value))} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-md text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">{t("metricName")}</th>
              <th className="p-2 border">{t("metricValue")}</th>
              <th className="p-2 border">{t("metricUnit")}</th>
              <th className="p-2 border">{t("actions")}</th>
            </tr>
          </thead>

          <tbody>
            {metrics.map((metric, index) => (
              <tr key={index}>
                <td className="p-2 border">
                  <Input
                    value={metric.metric_name}
                    onChange={e => handleMetricChange(index, 'metric_name', e.target.value)}
                    placeholder={t("metricName")}
                  />
                </td>

                <td className="p-2 border">
                  <Input
                    value={metric.metric_value}
                    onChange={e => handleMetricChange(index, 'metric_value', e.target.value)}
                    placeholder={t("metricValue")}
                  />
                </td>

                <td className="p-2 border">
                  <Input
                    value={metric.metric_unit}
                    onChange={e => handleMetricChange(index, 'metric_unit', e.target.value)}
                    placeholder={t("metricUnit")}
                  />
                </td>

                <td className="p-2 border">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => removeRow(index)}
                    disabled={metrics.length === 1}
                  >
                    {t("remove")}
                  </Button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-4">
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={addRow} disabled={loading}>
          + {t("addMetric")}
        </Button>

        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSubmit} disabled={loading}>
          {loading ? t("saving") : t("submit")}
        </Button>
      </div>

      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => (window.location.href = '/health-metrics-visualization')}
      >
        {t("visualizationTitle")}
      </Button>

    </Card>
  );
}

export { HealthMetricTracker, HealthMetricVisualization };
