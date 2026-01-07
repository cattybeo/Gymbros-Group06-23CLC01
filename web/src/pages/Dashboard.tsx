import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import {
  Users,
  Dumbbell,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

dayjs.locale('vi');

interface DashboardStats {
  totalMembers: number;
  totalClasses: number;
  activeMemberships: number;
  todayBookings: number;
}

export default function Dashboard() {
  const { profile } = useAuthContext();
  const [stats, setStats] = useState<DashboardStats>({
    totalMembers: 0,
    totalClasses: 0,
    activeMemberships: 0,
    todayBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [bookingsByDay, setBookingsByDay] = useState<any[]>([]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Fetch total members
        const { count: membersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'Member');

        // Fetch total classes
        const { count: classesCount } = await supabase
          .from('classes')
          .select('*', { count: 'exact', head: true });

        // Fetch active memberships
        const { count: membershipsCount } = await supabase
          .from('user_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch today's bookings
        const today = dayjs().format('YYYY-MM-DD');
        const { count: todayBookingsCount } = await supabase
          .from('bookings')
          .select('*', { count: 'exact', head: true })
          .gte('booking_date', `${today}T00:00:00`)
          .lt('booking_date', `${today}T23:59:59`);

        // Fetch recent bookings with user and class info
        const { data: bookings } = await supabase
          .from('bookings')
          .select(`
            *,
            profiles:user_id (full_name, avatar_url),
            classes:class_id (name)
          `)
          .order('booking_date', { ascending: false })
          .limit(5);

        // Fetch bookings for the last 7 days for chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = dayjs().subtract(6 - i, 'day');
          return {
            date: date.format('YYYY-MM-DD'),
            label: date.format('dd'),
          };
        });

        const bookingsData = await Promise.all(
          last7Days.map(async ({ date, label }) => {
            const { count } = await supabase
              .from('bookings')
              .select('*', { count: 'exact', head: true })
              .gte('booking_date', `${date}T00:00:00`)
              .lt('booking_date', `${date}T23:59:59`);
            return { name: label, bookings: count || 0 };
          })
        );

        setStats({
          totalMembers: membersCount || 0,
          totalClasses: classesCount || 0,
          activeMemberships: membershipsCount || 0,
          todayBookings: todayBookingsCount || 0,
        });

        setRecentBookings(bookings || []);
        setBookingsByDay(bookingsData);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Xin chào, {profile?.full_name || 'Admin'} 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              {dayjs().format('dddd, D MMMM YYYY')}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              {dayjs().format('HH:mm')}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Tổng hội viên"
            value={stats.totalMembers}
            icon={Users}
          />
          <StatCard
            title="Lớp học"
            value={stats.totalClasses}
            icon={Dumbbell}
          />
          <StatCard
            title="Gói đang hoạt động"
            value={stats.activeMemberships}
            icon={CreditCard}
          />
          <StatCard
            title="Đặt lớp hôm nay"
            value={stats.todayBookings}
            icon={TrendingUp}
          />
        </div>

        {/* Charts and Activity */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Bookings Chart */}
          <Card className="border-border/50 bg-card/80 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Đặt lớp 7 ngày qua
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={bookingsByDay}>
                    <defs>
                      <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 33%, 17%)" />
                    <XAxis
                      dataKey="name"
                      stroke="hsl(215, 20%, 55%)"
                      fontSize={12}
                    />
                    <YAxis
                      stroke="hsl(215, 20%, 55%)"
                      fontSize={12}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222, 47%, 10%)',
                        border: '1px solid hsl(217, 33%, 17%)',
                        borderRadius: '8px',
                      }}
                      itemStyle={{ color: 'hsl(210, 40%, 98%)' }}
                      labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="bookings"
                      stroke="hsl(217, 91%, 60%)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorBookings)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-primary" />
                Đặt lớp gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-3"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                        <Dumbbell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="truncate text-sm font-medium text-foreground">
                          {booking.profiles?.full_name || 'Hội viên'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.classes?.name} • {dayjs(booking.booking_date).format('HH:mm DD/MM')}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    Chưa có đặt lớp nào
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
