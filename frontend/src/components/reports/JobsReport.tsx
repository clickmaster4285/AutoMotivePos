// components/reports/JobsReport.tsx
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface JobsReportProps {
  jobs: any[];
  users: any[];
}

export function JobsReport({ jobs, users }: JobsReportProps) {
  const jobsData = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'completed' || j.status === 'paid').length;
    const inProgress = jobs.filter(j => j.status === 'in_progress').length;
    const pending = jobs.filter(j => j.status === 'pending').length;
    const waiting = jobs.filter(j => j.status === 'waiting_parts').length;
    
    // Jobs by technician
    const techJobs: Record<string, { name: string; total: number; completed: number }> = {};
    jobs.forEach(j => {
      if (j.technicianId) {
        const tech = users.find(u => u.id === j.technicianId);
        const name = tech?.name || 'Unknown';
        if (!techJobs[j.technicianId]) {
          techJobs[j.technicianId] = { name, total: 0, completed: 0 };
        }
        techJobs[j.technicianId].total++;
        if (j.status === 'completed' || j.status === 'paid') {
          techJobs[j.technicianId].completed++;
        }
      }
    });

    // Weekly trend based on actual data
    const weeklyMap: Record<string, { week: string; pending: number; progress: number; completed: number }> = {};
    jobs.forEach(job => {
      const date = new Date(job.createdAt);
      const weekNum = Math.ceil(date.getDate() / 7);
      const weekKey = `Week ${weekNum}`;
      
      if (!weeklyMap[weekKey]) {
        weeklyMap[weekKey] = { week: weekKey, pending: 0, progress: 0, completed: 0 };
      }
      
      if (job.status === 'pending') weeklyMap[weekKey].pending++;
      else if (job.status === 'in_progress') weeklyMap[weekKey].progress++;
      else if (job.status === 'completed' || job.status === 'paid') weeklyMap[weekKey].completed++;
    });

    const statusData = [
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Waiting Parts', value: waiting, color: '#8b5cf6' },
      { name: 'Completed', value: completed, color: '#10b981' },
    ].filter(d => d.value > 0);

    return {
      total,
      completed,
      inProgress,
      pending,
      waiting,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
      techPerformance: Object.values(techJobs),
      weeklyTrend: Object.values(weeklyMap),
      statusData,
    };
  }, [jobs, users]);

  const chartTooltipStyle = {
    background: 'hsl(228, 14%, 10%)',
    border: '1px solid hsl(228, 12%, 18%)',
    borderRadius: '6px',
    fontSize: 11,
    color: 'hsl(220, 10%, 88%)',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Total Jobs</p>
            <p className="text-lg font-bold">{jobsData.total}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Completed</p>
            <p className="text-lg font-bold text-green-500">{jobsData.completed}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">In Progress</p>
            <p className="text-lg font-bold text-blue-500">{jobsData.inProgress}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Waiting Parts</p>
            <p className="text-lg font-bold text-yellow-500">{jobsData.waiting}</p>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-3">
            <p className="text-[9px] text-muted-foreground font-mono uppercase">Completion Rate</p>
            <p className="text-lg font-bold">{jobsData.completionRate.toFixed(0)}%</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Job Status Distribution</h3>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={220}>
                <PieChart>
                  <Pie data={jobsData.statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" strokeWidth={0}>
                    {jobsData.statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {jobsData.statusData.map(entry => (
                  <div key={entry.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
                    <span className="text-muted-foreground">{entry.name}</span>
                    <span className="font-bold ml-auto">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Weekly Job Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={jobsData.weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 15%)" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="progress" fill="#3b82f6" name="In Progress" />
                <Bar dataKey="completed" fill="#10b981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {jobsData.techPerformance.length > 0 && (
        <Card>
          <CardContent className="p-5">
            <h3 className="text-xs font-heading font-bold mb-4 uppercase tracking-wider">Technician Performance</h3>
            <div className="space-y-3">
              {jobsData.techPerformance.map(tech => (
                <div key={tech.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{tech.name}</span>
                    <span className="font-bold">{tech.completed} / {tech.total} completed</span>
                  </div>
                  <div className="h-2 w-full rounded bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${(tech.completed / tech.total) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}