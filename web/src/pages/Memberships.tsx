import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase, MembershipTier, MembershipPlan } from '@/lib/supabase';
import { EditPlanDialog } from '@/components/memberships/EditPlanDialog';
import {
  CreditCard,
  Star,
  Crown,
  Sparkles,
  Users,
  Edit,
} from 'lucide-react';

interface TierWithPlans extends MembershipTier {
  membership_plans: MembershipPlan[];
  subscribers_count?: number;
}

const tierIcons: Record<string, any> = {
  basic: Star,
  silver: Star,
  gold: Crown,
  platinum: Sparkles,
  diamond: Sparkles,
};

const tierColors: Record<string, string> = {
  basic: 'bg-muted text-muted-foreground',
  silver: 'bg-muted text-muted-foreground',
  gold: 'bg-warning/20 text-warning',
  platinum: 'bg-primary/20 text-primary',
  diamond: 'bg-success/20 text-success',
};

export default function Memberships() {
  const [tiers, setTiers] = useState<TierWithPlans[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriberCounts, setSubscriberCounts] = useState<Record<string, number>>({});
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [editingTierName, setEditingTierName] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, []);

  async function fetchMemberships() {
    setLoading(true);
    
    const { data: tiersData, error: tiersError } = await supabase
      .from('membership_tiers')
      .select(`
        *,
        membership_plans (*)
      `)
      .order('level', { ascending: true });

    if (!tiersError && tiersData) {
      setTiers(tiersData as TierWithPlans[]);

      const counts: Record<string, number> = {};
      for (const tier of tiersData) {
        const planIds = tier.membership_plans?.map((p: any) => p.id) || [];
        if (planIds.length > 0) {
          const { count } = await supabase
            .from('user_memberships')
            .select('*', { count: 'exact', head: true })
            .in('plan_id', planIds)
            .eq('status', 'active');
          counts[tier.id] = count || 0;
        } else {
          counts[tier.id] = 0;
        }
      }
      setSubscriberCounts(counts);
    }
    
    setLoading(false);
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const totalActiveSubscribers = Object.values(subscriberCounts).reduce((a, b) => a + b, 0);

  const handleEditPlan = (plan: MembershipPlan, tierName: string) => {
    setEditingPlan(plan);
    setEditingTierName(tierName);
    setEditDialogOpen(true);
  };

  // Flatten all plans for table view
  const allPlans = tiers.flatMap(tier => 
    (tier.membership_plans || []).map(plan => ({
      ...plan,
      tierName: tier.name,
      tierCode: tier.code,
      tierLevel: tier.level,
    }))
  ).sort((a, b) => {
    if (a.tierLevel !== b.tierLevel) return a.tierLevel - b.tierLevel;
    return a.duration_months - b.duration_months;
  });

  return (
    <DashboardLayout requireAdmin>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Quản lý Gói Hội viên
          </h1>
          <p className="mt-1 text-muted-foreground">
            Thiết lập và điều chỉnh các gói giá membership
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{tiers.length}</p>
                <p className="text-sm text-muted-foreground">Hạng hội viên</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                <Users className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalActiveSubscribers}</p>
                <p className="text-sm text-muted-foreground">Đang hoạt động</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/80">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/20">
                <Crown className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{allPlans.length}</p>
                <p className="text-sm text-muted-foreground">Gói giá</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tier Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {tiers.map((tier) => {
            const Icon = tierIcons[tier.code.toLowerCase()] || Star;
            const colorClass = tierColors[tier.code.toLowerCase()] || 'bg-muted text-muted-foreground';
            const subscribers = subscriberCounts[tier.id] || 0;
            const activePlans = tier.membership_plans?.filter(p => p.is_active).length || 0;
            
            return (
              <Card key={tier.id} className="border-border/50 bg-card/80">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{tier.name}</p>
                      <p className="text-xs text-muted-foreground">Level {tier.level}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{subscribers}</p>
                      <p className="text-xs text-muted-foreground">{activePlans} gói giá</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Card className="border-border/50 bg-card/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Danh sách gói giá ({allPlans.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead>Hạng</TableHead>
                      <TableHead>Thời hạn</TableHead>
                      <TableHead>Giá</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allPlans.length > 0 ? (
                      allPlans.map((plan) => {
                        const Icon = tierIcons[plan.tierCode.toLowerCase()] || Star;
                        const colorClass = tierColors[plan.tierCode.toLowerCase()] || 'bg-muted text-muted-foreground';
                        
                        return (
                          <TableRow key={plan.id} className="border-border/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClass}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <span className="font-medium text-foreground">{plan.tierName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-foreground">
                              {plan.duration_months} tháng
                            </TableCell>
                            <TableCell className="font-semibold text-foreground">
                              {formatPrice(plan.price)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                                {plan.is_active ? 'Hoạt động' : 'Tạm dừng'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditPlan(plan, plan.tierName)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                          Chưa có gói giá nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        <EditPlanDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          plan={editingPlan}
          tierName={editingTierName}
          onSuccess={fetchMemberships}
        />
      </div>
    </DashboardLayout>
  );
}
