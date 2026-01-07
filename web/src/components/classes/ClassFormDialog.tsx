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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, Profile, Location } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const formSchema = z.object({
  name: z.string().min(1, 'Tên lớp học không được để trống').max(100),
  description: z.string().max(500).optional(),
  capacity: z.coerce.number().min(1, 'Sức chứa tối thiểu là 1').max(100),
  trainer_id: z.string().optional(),
  location_id: z.string().optional(),
  start_time: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  end_time: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
});

type FormData = z.infer<typeof formSchema>;

interface ClassFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData?: {
    id: string;
    name: string;
    description: string | null;
    capacity: number;
    trainer_id: string | null;
    location_id: string | null;
    start_time: string;
    end_time: string;
  } | null;
  onSuccess: () => void;
}

export function ClassFormDialog({
  open,
  onOpenChange,
  classData,
  onSuccess,
}: ClassFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const isEditing = !!classData;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      capacity: 20,
      trainer_id: '',
      location_id: '',
      start_time: '',
      end_time: '',
    },
  });

  useEffect(() => {
    if (open) {
      fetchTrainersAndLocations();
      if (classData) {
        form.reset({
          name: classData.name,
          description: classData.description || '',
          capacity: classData.capacity,
          trainer_id: classData.trainer_id || '',
          location_id: classData.location_id || '',
          start_time: classData.start_time?.slice(0, 16) || '',
          end_time: classData.end_time?.slice(0, 16) || '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          capacity: 20,
          trainer_id: '',
          location_id: '',
          start_time: '',
          end_time: '',
        });
      }
    }
  }, [open, classData, form]);

  async function fetchTrainersAndLocations() {
    const [trainersRes, locationsRes] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role')
        .eq('role', 'PT'),
      supabase.from('locations').select('*'),
    ]);

    if (trainersRes.data) setTrainers(trainersRes.data as Profile[]);
    if (locationsRes.data) setLocations(locationsRes.data);
  }

  async function onSubmit(data: FormData) {
    setLoading(true);

    const payload = {
      name: data.name,
      description: data.description || null,
      capacity: data.capacity,
      trainer_id: data.trainer_id || null,
      location_id: data.location_id || null,
      start_time: data.start_time,
      end_time: data.end_time,
    };

    let error;

    if (isEditing) {
      const res = await supabase
        .from('classes')
        .update(payload)
        .eq('id', classData.id);
      error = res.error;
    } else {
      const res = await supabase.from('classes').insert(payload);
      error = res.error;
    }

    setLoading(false);

    if (error) {
      toast.error('Có lỗi xảy ra: ' + error.message);
    } else {
      toast.success(isEditing ? 'Cập nhật lớp học thành công!' : 'Tạo lớp học thành công!');
      onSuccess();
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Chỉnh sửa lớp học' : 'Thêm lớp học mới'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên lớp học *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Yoga buổi sáng" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mô tả ngắn về lớp học..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sức chứa *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} max={100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Huấn luyện viên (PT)</FormLabel>
                    <Select
                      value={field.value || "__none__"}
                      onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Chọn PT" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="__none__">Không chỉ định</SelectItem>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.full_name || 'Chưa có tên'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa điểm</FormLabel>
                  <Select 
                    value={field.value || "__none__"} 
                    onValueChange={(val) => field.onChange(val === "__none__" ? "" : val)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn địa điểm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="__none__">Không chỉ định</SelectItem>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian bắt đầu *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="end_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Thời gian kết thúc *</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
