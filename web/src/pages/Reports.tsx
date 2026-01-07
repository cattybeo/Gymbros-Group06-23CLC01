import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  Dumbbell,
  ArrowUpRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import dayjs from 'dayjs';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Reports() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    newMembersThisMonth: 0,
    totalClasses: 0,
    activeMemberships: 0,
  });
  const [membersByRole, setMembersByRole] = useState<{ name: string; value: number }[]>([]);
  const [classPopularity, setClassPopularity] = useState<{ name: string; bookings: number }[]>([]);
  const [membershipDistribution, setMembershipDistribution] = useState<{ name: string; value: number; color: string }[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  async function fetchReports() {
    setLoading(true);

    try {
      // Fetch total members
      const { count: totalMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch new members this month
      const startOfMonth = dayjs().startOf('month').toISOString();
      const { count: newMembers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);

      // Fetch total classes
      const { count: totalClasses } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      // Fetch active memberships
      const { count: activeMemberships } = await supabase
        .from('user_memberships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalMembers: totalMembers || 0,
        newMembersThisMonth: newMembers || 0,
        totalClasses: totalClasses || 0,
        activeMemberships: activeMemberships || 0,
      });

      // Fetch members by role
      const { data: profiles } = await supabase
        .from('profiles')
        .select('role');

      if (profiles) {
        const roleCounts: Record<string, number> = {};
        profiles.forEach((p) => {
          const role = p.role || 'Member';
          roleCounts[role] = (roleCounts[role] || 0) + 1;
        });
        setMembersByRole(
          Object.entries(roleCounts).map(([name, value]) => ({ name, value }))
        );
      }

      // Fetch class popularity (top 6 classes by bookings)
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          name,
          bookings (count)
        `)
        .limit(10);

      if (classes) {
        const classData = classes
          .map((c: any) => ({
            name: c.name.length > 12 ? c.name.substring(0, 12) + '...' : c.name,
            bookings: c.bookings?.[0]?.count || 0,
          }))
          .sort((a, b) => b.bookings - a.bookings)
          .slice(0, 6);
        setClassPopularity(classData);
      }

      // Fetch membership distribution
      const { data: tiers } = await supabase
        .from('membership_tiers')
        .select(`
          id,
          name,
          membership_plans (id)
        `);

      if (tiers) {
        const distribution = await Promise.all(
          tiers.map(async (tier: any, index) => {
            const planIds = tier.membership_plans?.map((p: any) => p.id) || [];
            let count = 0;
            if (planIds.length > 0) {
              const { count: subCount } = await supabase
                .from('user_memberships')
                .select('*', { count: 'exact', head: true })
                .in('plan_id', planIds)
                .eq('status', 'active');
              count = subCount || 0;
            }
            return {
              name: tier.name,
              value: count,
              color: COLORS[index % COLORS.length],
            };
          })
        );
        setMembershipDistribution(distribution.filter(d => d.value > 0));
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Báo cáo & Phân tích
          </h1>
          <p className="mt-1 text-muted-foreground">
            Tổng quan về dữ liệu hệ thống
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng người dùng</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.totalMembers}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Mới tháng này</p>
                      <p className="text-2xl font-bold text-foreground">{stats.newMembersThisMonth}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                      <TrendingUp className="h-6 w-6 text-success" />
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-sm text-success">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Người dùng mới</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Tổng lớp học</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalClasses}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                      <Dumbbell className="h-6 w-6 text-warning" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Gói đang hoạt động</p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.activeMemberships}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Class Popularity */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Lớp học phổ biến
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    {classPopularity.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={classPopularity} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                          <XAxis type="number" stroke="hsl(215, 20%, 55%)" fontSize={12} />
                          <YAxis dataKey="name" type="category" stroke="hsl(215, 20%, 55%)" fontSize={12} width={80} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(222, 47%, 10%)',
                              border: '1px solid hsl(217, 33%, 17%)',
                              borderRadius: '8px',
                            }}
                          />
                          <Bar dataKey="bookings" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        Chưa có dữ liệu
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Members by Role */}
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Phân bố theo vai trò
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8">
                    <div className="h-64 w-64">
                      {membersByRole.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={membersByRole}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {membersByRole.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(222, 47%, 10%)',
                                border: '1px solid hsl(217, 33%, 17%)',
                                borderRadius: '8px',
                              }}
                              itemStyle={{ color: 'hsl(210, 40%, 98%)' }}
                              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          Chưa có dữ liệu
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {membersByRole.map((item, index) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="w-20 text-foreground">{item.name}</span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Membership Distribution */}
            {membershipDistribution.length > 0 && (
              <Card className="border-border/50 bg-card/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Phân bố gói hội viên
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center gap-8">
                    <div className="h-64 w-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={membershipDistribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {membershipDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(222, 47%, 10%)',
                              border: '1px solid hsl(217, 33%, 17%)',
                              borderRadius: '8px',
                            }}
                            itemStyle={{ color: 'hsl(210, 40%, 98%)' }}
                            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-4">
                      {membershipDistribution.map((item) => (
                        <div key={item.name} className="flex items-center gap-3">
                          <div
                            className="h-4 w-4 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="w-20 text-foreground">{item.name}</span>
                          <span className="font-semibold text-foreground">{item.value}</span>
                          <span className="text-muted-foreground">hội viên</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
