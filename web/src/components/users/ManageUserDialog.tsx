import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase, Profile } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, Unlock, Trash2, RotateCcw } from 'lucide-react';

type ActionType = 'ban' | 'unban' | 'soft_delete' | 'restore';

interface ManageUserDialogProps {
  user: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ManageUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: ManageUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<ActionType>('ban');
  const [banDuration, setBanDuration] = useState<string>('permanent');
  const [customDays, setCustomDays] = useState('30');
  const { toast } = useToast();

  const isUserActive = user?.is_active !== false;

  async function handleSubmit() {
    if (!user) return;

    setIsLoading(true);
    try {
      // Calculate banned_until date if banning
      let banned_until: string | undefined;
      if (action === 'ban') {
        if (banDuration === 'permanent') {
          // 100 years in the future
          banned_until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          const days = parseInt(customDays) || 30;
          banned_until = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
        }
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      if (!accessToken) {
        throw new Error('Bạn chưa đăng nhập');
      }

      const response = await supabase.functions.invoke('manage-user', {
        body: { action, user_id: user.id, banned_until },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Có lỗi xảy ra');
      }

      const messages: Record<ActionType, string> = {
        ban: 'Đã khóa tài khoản',
        unban: 'Đã mở khóa tài khoản',
        soft_delete: 'Đã xóa tài khoản',
        restore: 'Đã khôi phục tài khoản',
      };

      toast({
        title: messages[action],
        description: `Tài khoản của ${user.full_name || user.email} đã được cập nhật.`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Manage user error:', error);
      toast({
        title: 'Lỗi',
        description: error.message || 'Không thể thực hiện thao tác.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const actionConfig: Record<ActionType, { icon: any; label: string; description: string; variant: 'default' | 'destructive' }> = {
    ban: {
      icon: Lock,
      label: 'Khóa tài khoản',
      description: 'Người dùng sẽ không thể đăng nhập cho đến khi được mở khóa.',
      variant: 'destructive',
    },
    unban: {
      icon: Unlock,
      label: 'Mở khóa tài khoản',
      description: 'Người dùng sẽ có thể đăng nhập lại bình thường.',
      variant: 'default',
    },
    soft_delete: {
      icon: Trash2,
      label: 'Xóa tài khoản',
      description: 'Tài khoản sẽ bị đánh dấu là đã xóa nhưng dữ liệu vẫn được giữ lại.',
      variant: 'destructive',
    },
    restore: {
      icon: RotateCcw,
      label: 'Khôi phục tài khoản',
      description: 'Khôi phục tài khoản đã bị xóa hoặc khóa.',
      variant: 'default',
    },
  };

  const currentAction = actionConfig[action];
  const Icon = currentAction.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Quản lý tài khoản</DialogTitle>
          <DialogDescription>
            Thao tác với tài khoản của{' '}
            <strong>{user?.full_name || user?.email || 'người dùng'}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={action} onValueChange={(v) => setAction(v as ActionType)}>
            {isUserActive ? (
              <>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="ban" id="ban" />
                  <Label htmlFor="ban" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-destructive" />
                      <span>Khóa tài khoản</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Chặn đăng nhập tạm thời hoặc vĩnh viễn
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="soft_delete" id="soft_delete" />
                  <Label htmlFor="soft_delete" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span>Xóa tài khoản</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Đánh dấu đã xóa, có thể khôi phục
                    </p>
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="unban" id="unban" />
                  <Label htmlFor="unban" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Unlock className="h-4 w-4 text-success" />
                      <span>Mở khóa tài khoản</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cho phép đăng nhập lại
                    </p>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 rounded-md border p-3 cursor-pointer hover:bg-accent">
                  <RadioGroupItem value="restore" id="restore" />
                  <Label htmlFor="restore" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-success" />
                      <span>Khôi phục tài khoản</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Khôi phục tài khoản đã xóa
                    </p>
                  </Label>
                </div>
              </>
            )}
          </RadioGroup>

          {action === 'ban' && (
            <div className="space-y-3 mt-4 p-3 bg-muted/50 rounded-lg">
              <Label>Thời hạn khóa</Label>
              <RadioGroup value={banDuration} onValueChange={setBanDuration}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="permanent" id="permanent" />
                  <Label htmlFor="permanent" className="cursor-pointer">Vĩnh viễn</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">Tùy chỉnh</Label>
                </div>
              </RadioGroup>
              {banDuration === 'custom' && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    type="number"
                    min="1"
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value)}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">ngày</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            variant={currentAction.variant}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Icon className="mr-2 h-4 w-4" />
                {currentAction.label}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
