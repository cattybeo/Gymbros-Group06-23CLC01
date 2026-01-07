import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, AppRole } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus } from 'lucide-react';

const baseSchema = z.object({
  role: z.enum(['PT', 'Staff', 'Admin']),
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

const ptSchema = baseSchema.extend({
  role: z.literal('PT'),
  full_name: z.string().min(1, 'Vui lòng nhập tên'),
  phone: z.string().min(10, 'Số điện thoại không hợp lệ').max(11, 'Số điện thoại không hợp lệ'),
});

const staffAdminSchema = baseSchema.extend({
  role: z.enum(['Staff', 'Admin']),
  full_name: z.string().optional(),
  phone: z.string().optional(),
});

const formSchema = z.discriminatedUnion('role', [ptSchema, staffAdminSchema]);

type FormValues = z.infer<typeof formSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateUserDialog({ open, onOpenChange, onSuccess }: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: 'PT',
      email: '',
      password: '',
      full_name: '',
      phone: '',
    },
  });

  const selectedRole = form.watch('role');

  async function onSubmit(values: FormValues) {
    setLoading(true);
    try {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: values.full_name || null,
            phone: values.phone || null,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Update the profile with role and additional info
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            role: values.role as AppRole,
            full_name: values.full_name || null,
            phone: values.phone || null,
            is_active: true,
          })
          .eq('id', authData.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
          // Profile might not exist yet due to trigger delay, try insert
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user.id,
              role: values.role as AppRole,
              full_name: values.full_name || null,
              phone: values.phone || null,
              is_active: true,
            });

          if (insertError && insertError.code !== '23505') {
            throw insertError;
          }
        }

        toast({
          title: 'Tạo tài khoản thành công',
          description: `Đã tạo tài khoản ${values.role} cho ${values.email}`,
        });

        form.reset();
        onOpenChange(false);
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      
      let errorMessage = 'Không thể tạo tài khoản. Vui lòng thử lại.';
      if (error.message?.includes('already registered')) {
        errorMessage = 'Email này đã được đăng ký';
      }
      
      toast({
        title: 'Lỗi',
        description: errorMessage,
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
            <UserPlus className="h-5 w-5 text-primary" />
            Tạo tài khoản mới
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loại tài khoản</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Reset optional fields when changing role
                      if (value !== 'PT') {
                        form.setValue('full_name', '');
                        form.setValue('phone', '');
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn loại tài khoản" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PT">PT (Huấn luyện viên)</SelectItem>
                      <SelectItem value="Staff">Staff (Nhân viên)</SelectItem>
                      <SelectItem value="Admin">Admin (Quản trị)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mật khẩu</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedRole === 'PT' && (
              <>
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Họ và tên</FormLabel>
                      <FormControl>
                        <Input placeholder="Nguyễn Văn A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số điện thoại</FormLabel>
                      <FormControl>
                        <Input placeholder="0912345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

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
                Tạo tài khoản
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
