import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { supabase, MembershipPlan } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Edit } from 'lucide-react';

const formSchema = z.object({
  price: z.coerce.number().min(0, 'Giá phải >= 0'),
  duration_months: z.coerce.number().min(1, 'Thời hạn tối thiểu 1 tháng'),
  is_active: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: MembershipPlan | null;
  tierName: string;
  onSuccess: () => void;
}

export function EditPlanDialog({ open, onOpenChange, plan, tierName, onSuccess }: EditPlanDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      price: 0,
      duration_months: 1,
      is_active: true,
    },
  });

  useEffect(() => {
    if (plan) {
      form.reset({
        price: plan.price,
        duration_months: plan.duration_months,
        is_active: plan.is_active,
      });
    }
  }, [plan, form]);

  async function onSubmit(values: FormValues) {
    if (!plan) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('membership_plans')
        .update({
          price: values.price,
          duration_months: values.duration_months,
          is_active: values.is_active,
        })
        .eq('id', plan.id);

      if (error) throw error;

      toast({
        title: 'Cập nhật thành công',
        description: `Đã cập nhật gói ${values.duration_months} tháng`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating plan:', error);
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật gói. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Chỉnh sửa gói {tierName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="duration_months"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thời hạn (tháng)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giá (VND)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} step={1000} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />


            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel className="cursor-pointer">Đang hoạt động</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
