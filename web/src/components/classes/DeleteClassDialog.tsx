import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeleteClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: { id: string; name: string } | null;
  onSuccess: () => void;
}

export function DeleteClassDialog({
  open,
  onOpenChange,
  classData,
  onSuccess,
}: DeleteClassDialogProps) {
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!classData) return;

    setLoading(true);
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classData.id);
    setLoading(false);

    if (error) {
      toast.error('Có lỗi xảy ra: ' + error.message);
    } else {
      toast.success('Đã xóa lớp học thành công!');
      onSuccess();
      onOpenChange(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận xóa lớp học</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc muốn xóa lớp học{' '}
            <strong>"{classData?.name}"</strong>? Hành động này không thể hoàn tác
            và sẽ xóa toàn bộ dữ liệu đăng ký liên quan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
