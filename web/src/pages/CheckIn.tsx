import { useState, useRef, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase, Profile, UserMembership } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  ScanBarcode,
  Camera,
  CameraOff,
  UserCheck,
  UserX,
  Clock,
  CreditCard,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  History,
  MapPin,
} from 'lucide-react';
import { BarcodeScanner } from '@/components/checkin/BarcodeScanner';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface CheckInResult {
  profile: Profile;
  membership: UserMembership | null;
  isActive: boolean;
  message: string;
}

interface AccessLog {
  id: string;
  user_id: string;
  staff_id: string | null;
  entered_at: string;
  gate_location: string | null;
  user?: Profile;
}

export default function CheckIn() {
  const [memberId, setMemberId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckInResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [recentLogs, setRecentLogs] = useState<AccessLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [gateLocation, setGateLocation] = useState('Main Lobby');
  const [isCameraActive, setIsCameraActive] = useState(false);

  // Fetch recent access logs
  useEffect(() => {
    fetchRecentLogs();
  }, []);

  const fetchRecentLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('access_logs')
        .select(`
          *,
          user:profiles!access_logs_user_id_fkey(id, full_name, avatar_url, phone)
        `)
        .order('entered_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentLogs(data || []);
    } catch (error) {
      console.error('Error fetching access logs:', error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const searchMembers = async (query: string) => {
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    try {
      // Check if query looks like UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.trim());
      
      if (isUUID) {
        // Direct lookup by UUID
        lookupMemberById(query.trim());
        return;
      }

      // Search by name, phone, or email (all roles)
      const searchTerm = query.trim();
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.*${searchTerm}*,phone.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*`)
        .limit(5);

      if (error) throw error;
      
      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error searching members:', error);
    }
  };

  const lookupMemberById = async (id: string) => {
    setLoading(true);
    setResult(null);
    setShowResults(false);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (profileError || !profile) {
        toast.error('Không tìm thấy hội viên');
        setLoading(false);
        return;
      }

      // Fetch active membership
      const today = new Date().toISOString().split('T')[0];
      const { data: membership } = await supabase
        .from('user_memberships')
        .select(`
          *,
          plan:membership_plans(
            *,
            tier:membership_tiers(*)
          )
        `)
        .eq('user_id', id)
        .eq('status', 'active')
        .gte('end_date', today)
        .order('end_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const isActive = !!membership && profile.is_active !== false;

      setResult({
        profile,
        membership,
        isActive,
        message: isActive
          ? 'Hội viên hợp lệ - Cho phép vào'
          : profile.is_active === false
          ? 'Tài khoản đã bị khóa'
          : 'Hội viên hết hạn hoặc chưa đăng ký gói',
      });

      if (isActive) {
        // Insert access log
        const { error: logError } = await supabase
          .from('access_logs')
          .insert({
            user_id: profile.id,
            gate_location: gateLocation,
          });

        if (logError) {
          console.error('Error creating access log:', logError);
        } else {
          // Refresh recent logs
          fetchRecentLogs();
        }

        toast.success('Check-in thành công!');
      } else {
        toast.error(
          profile.is_active === false
            ? 'Tài khoản đã bị khóa'
            : 'Hội viên không có gói còn hạn'
        );
      }
    } catch (error) {
      console.error('Error looking up member:', error);
      toast.error('Có lỗi xảy ra khi tra cứu');
    } finally {
      setLoading(false);
    }
  };

  const selectMember = (profile: Profile) => {
    setMemberId(profile.full_name || profile.id);
    setSearchResults([]);
    setShowResults(false);
    lookupMemberById(profile.id);
  };

  const handleSearch = () => {
    if (!memberId.trim()) {
      toast.error('Vui lòng nhập thông tin hội viên');
      return;
    }
    searchMembers(memberId);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMemberId(value);
    searchMembers(value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleBarcodeScan = useCallback((decodedText: string) => {
    // Stop camera temporarily after scan
    setIsCameraActive(false);
    setMemberId(decodedText);
    toast.info(`Đã quét: ${decodedText}`);
    lookupMemberById(decodedText);
  }, []);

  const toggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  const handleReset = () => {
    setMemberId('');
    setResult(null);
    setIsCameraActive(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Trung tâm Check-in
          </h1>
          <p className="text-muted-foreground">
            Tìm hội viên bằng tên, số điện thoại hoặc mã UUID
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanBarcode className="h-5 w-5 text-primary" />
                  Tìm hội viên
                </CardTitle>
                <CardDescription>
                  Nhập tên, số điện thoại hoặc mã UUID để tra cứu
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Gate Location */}
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Vị trí:</span>
                  <select
                    value={gateLocation}
                    onChange={(e) => setGateLocation(e.target.value)}
                    className="bg-transparent border-none font-medium text-foreground focus:outline-none cursor-pointer"
                  >
                    <option value="Main Lobby">Sảnh chính</option>
                    <option value="Turnstile 1">Cửa xoay 1</option>
                    <option value="Turnstile 2">Cửa xoay 2</option>
                    <option value="Gym Floor">Sàn tập</option>
                  </select>
                </div>

                <div className="relative">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Nhập tên, SĐT hoặc UUID..."
                      value={memberId}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      className="flex-1"
                    />
                    <Button onClick={handleSearch} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  {/* Search Results Dropdown */}
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg">
                      {searchResults.map((profile) => (
                        <button
                          key={profile.id}
                          type="button"
                          className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors border-b last:border-b-0"
                          onClick={() => selectMember(profile)}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {profile.full_name || 'Chưa có tên'}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {profile.phone || profile.email || 'Không có liên hệ'}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {profile.role}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Empty state with suggestions */}
                  {showResults && searchResults.length === 0 && memberId.trim().length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-lg p-4 text-center text-muted-foreground">
                      <p>Không tìm thấy hội viên</p>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">hoặc</span>
                  </div>
                </div>

                {/* Camera Scanner */}
                <div className="space-y-3">
                  <Button
                    variant={isCameraActive ? 'destructive' : 'outline'}
                    className="w-full"
                    onClick={toggleCamera}
                  >
                    {isCameraActive ? (
                      <>
                        <CameraOff className="mr-2 h-4 w-4" />
                        Tắt camera
                      </>
                    ) : (
                      <>
                        <Camera className="mr-2 h-4 w-4" />
                        Quét bằng webcam
                      </>
                    )}
                  </Button>

                  {isCameraActive && (
                    <div className="space-y-2">
                      <BarcodeScanner
                        isScanning={isCameraActive}
                        onResult={handleBarcodeScan}
                      />
                      <p className="text-xs text-center text-muted-foreground">
                        Đưa barcode vào khung hình để quét
                      </p>
                    </div>
                  )}
                </div>

                {result && (
                  <Button variant="ghost" className="w-full" onClick={handleReset}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Làm mới
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Recent Check-ins */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4 text-primary" />
                  Check-in gần đây
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingLogs ? (
                  <div className="flex justify-center py-4">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : recentLogs.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {recentLogs.map((log) => (
                      <button
                        key={log.id}
                        type="button"
                        className="flex w-full items-center gap-3 rounded-lg p-2 hover:bg-muted transition-colors text-left"
                        onClick={() => log.user && selectMember(log.user as Profile)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={log.user?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {log.user?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {log.user?.full_name || 'Unknown'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{log.gate_location || 'N/A'}</span>
                            <span>•</span>
                            <span>
                              {formatDistanceToNow(new Date(log.entered_at), {
                                addSuffix: true,
                                locale: vi,
                              })}
                            </span>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có lượt check-in nào
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Result Section */}
          <Card className={result ? (result.isActive ? 'border-success' : 'border-destructive') : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result?.isActive ? (
                  <UserCheck className="h-5 w-5 text-success" />
                ) : (
                  <UserX className="h-5 w-5 text-muted-foreground" />
                )}
                Kết quả tra cứu
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <div className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`flex items-center gap-3 rounded-lg p-4 ${
                      result.isActive
                        ? 'bg-success/10 text-success'
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {result.isActive ? (
                      <CheckCircle2 className="h-8 w-8" />
                    ) : (
                      <XCircle className="h-8 w-8" />
                    )}
                    <div>
                      <p className="font-semibold text-lg">{result.message}</p>
                      <p className="text-sm opacity-80">
                        {result.isActive ? 'Cho phép truy cập' : 'Từ chối truy cập'}
                      </p>
                    </div>
                  </div>

                  {/* Member Info */}
                  <div className="flex items-center gap-4 rounded-lg border p-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={result.profile.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {result.profile.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {result.profile.full_name || 'Chưa có tên'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {result.profile.email || result.profile.phone || 'Không có liên hệ'}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant={result.profile.is_active !== false ? 'default' : 'destructive'}>
                          {result.profile.is_active !== false ? 'Hoạt động' : 'Đã khóa'}
                        </Badge>
                        <Badge variant="outline">{result.profile.role}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Membership Info */}
                  {result.membership ? (
                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <CreditCard className="h-5 w-5" />
                        <span className="font-medium">Thông tin gói hội viên</span>
                      </div>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gói:</span>
                          <Badge className="gym-gradient">
                            {result.membership.plan?.tier?.name || 'N/A'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Thời hạn:</span>
                          <span>{result.membership.plan?.duration_months} tháng</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ngày hết hạn:</span>
                          <span className="font-medium">
                            {format(new Date(result.membership.end_date), 'dd/MM/yyyy', { locale: vi })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
                      <Clock className="mx-auto h-8 w-8 mb-2" />
                      <p>Hội viên chưa có gói còn hạn</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ScanBarcode className="h-16 w-16 mb-4 opacity-50" />
                  <p>Nhập mã hội viên để kiểm tra</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
